/** This module contains Inngest Functions that are invoked in response to Inngest events. */

import { getSupabaseClientWithToken } from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { inngest } from './client';
import {
  Episode,
  EpisodeStatus,
  Json,
  GetEpisode,
  UpdateEpisode,
  GetPodcastWithEpisodesByID,
  Ingest,
  GetCurrentSubscription,
  GetPodcastStats,
  PLANS,
} from 'podverse-utils';
import { TranscribeEpisode, SummarizeEpisode, SpeakerIDEpisode, EmbedEpisode, SuggestEpisode } from '@/lib/process';
import { isReady } from '@/lib/episode';

/** Return false if the user's plan does not permit processing of this Episode. */
async function checkUserPlanLimit(supabase: SupabaseClient, episode: Episode): Promise<boolean> {
  const podcastStats = await GetPodcastStats(supabase);
  const subscription = await GetCurrentSubscription(supabase);
  let plan = PLANS.free;
  if (subscription) {
    plan = PLANS[subscription.plan as keyof typeof PLANS];
  }
  const stat = podcastStats.find((p) => p.id === episode.podcast);
  if (!stat) {
    throw new Error(`Podcast ${episode.podcast} not found in podcast stats`);
  }
  const processed = stat?.processed || 0;
  return processed < (plan.maxEpisodesPerPodcast || Infinity);
}

/** Process a single episode. */
export const processEpisode = inngest.createFunction(
  {
    id: 'process-episode',
    retries: 0,
    concurrency: {
      // Limit number of concurrent calls to Deepgram to avoid hitting API limit.
      limit: 10,
    },
  },
  { event: 'process/episode' },
  async ({ event, step }) => {
    const { episodeId, force, supabaseAccessToken } = event.data;
    if (!episodeId) {
      throw new Error('process/episode - Missing episodeId in event data');
    }
    console.log(`process/episode event received for episodeId ${episodeId}`, event);
    const supabase = await getSupabaseClientWithToken(supabaseAccessToken);

    let episode = await GetEpisode(supabase, episodeId);

    // Check plan limit and bail out if we've hit it.
    if (!checkUserPlanLimit(supabase, episode)) {
      episode.error = { message: 'Plan limit reached' };
      episode.status = {
        ...(episode.status as EpisodeStatus),
        message: `Error: Plan limit reached`,
        completedAt: new Date().toISOString(),
      };
      await UpdateEpisode(supabase, episode);
      return {
        event,
        body: {
          message: 'Plan limit reached',
        },
      };
    }

    episode.status = {
      ...(episode.status as EpisodeStatus),
      startedAt: new Date().toISOString(),
      completedAt: null,
      message: 'Starting processing',
    };
    episode.error = null;
    await UpdateEpisode(supabase, episode);

    const currentHostname = process.env.VERCEL_URL ?? 'deepdocks.tailf7e81.ts.net';

    try {
      // Start transcription.
      const transcribeResult = await step.run('transcribe', async () => {
        console.log(`process/episode [${episodeId}] - Transcribing`);
        const callbackUrl = `https://${currentHostname}/api/episode/${episode.id}/transcript`;
        console.log(`process/episode [${episodeId}] - Callback URL: ${callbackUrl}`);
        const result = await TranscribeEpisode({
          supabase,
          supabaseToken: supabaseAccessToken,
          episode,
          callbackUrl,
          force,
        });
        console.log(`process/episode [${episodeId}] - Transcribe result: ${result}`);
        return result;
      });

      // Wait for transcript.
      //
      // Deepgram will call back to our /api/episode/:episodeId/transcript endpoint,
      // which fires this event to continue processing.ID
      if (transcribeResult === 'Transcription started') {
        console.log(`process/episode [${episodeId}] - Waiting for transcript-received event`);
        await step.waitForEvent('transcript-received', {
          event: 'process/transcript',
          timeout: '1h',
          match: 'data.episodeId',
        });
        console.log(`process/episode [${episodeId}] - Got transcript-received event, continuing`);
      } else {
        console.log(`process/episode [${episodeId}] - Transcription already complete, continuing`);
      }

      // Summarize.
      const summarizeResult = await step.run('summarize', async () => {
        console.log(`process/episode [${episodeId}] - Summarizing`);
        const result = await SummarizeEpisode({ supabase, episode, force });
        console.log(`process/episode [${episodeId}] - Summarize result: ${result}`);
        return result;
      });

      // Speaker ID.
      const speakerIdResult = await step.run('speakerId', async () => {
        console.log(`process/episode [${episodeId}] - Speaker ID`);
        const result = await SpeakerIDEpisode({ supabase, episode, force });
        console.log(`process/episode [${episodeId}] - Speaker ID result: ${result}`);
        return result;
      });

      // Generate suggested queries.
      const suggestionResult = await step.run('suggestions', async () => {
        console.log(`process/episode [${episodeId}] - Suggesting queries`);
        const result = await SuggestEpisode({ supabase, episode, force });
        console.log(`process/episode [${episodeId}] - Suggesting queries result: ${result}`);
        return result;
      });

      // Embed.
      const embedResult = await step.run('embed', async () => {
        console.log(`process/episode [${episodeId}] - Embed`);
        const result = await EmbedEpisode({ supabase, episode, force });
        console.log(`process/episode [${episodeId}] - Embed result: ${result}`);
        return result;
      });

      episode = await GetEpisode(supabase, episodeId);
      episode.status = {
        ...(episode.status as EpisodeStatus),
        message: 'Finished processing',
        completedAt: new Date().toISOString(),
      };
      await UpdateEpisode(supabase, episode);
      return {
        event,
        body: {
          transcribeResult: await transcribeResult,
          summarizeResult: await summarizeResult,
          speakerIdResult: await speakerIdResult,
          suggestionResult: await suggestionResult,
          embedResult: await embedResult,
        },
      };
    } catch (error) {
      console.error(`Error processing episode ${episodeId}`, error);
      episode.error = error as Json;
      episode.status = {
        ...(episode.status as EpisodeStatus),
        message: `Error: ${JSON.stringify(error)}`,
        completedAt: new Date().toISOString(),
      };
      await UpdateEpisode(supabase, episode);
    }
  },
);

/** Scan for unprocessed episodes and fire off events to process them. */
export const processPodcast = inngest.createFunction(
  {
    id: 'process-podcast',
    retries: 0,
    concurrency: {
      // Limit number of concurrent calls to Deepgram to avoid hitting API limit.
      limit: 10,
    },
  },
  { event: 'process/podcast' },
  async ({ event, step, runId }) => {
    const { podcastId, force, supabaseAccessToken } = event.data;
    console.log(`process/podcast - event ${runId} received for ${podcastId}, force ${force}`);

    const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
    const podcast = await GetPodcastWithEpisodesByID(supabase, podcastId);
    // XXX MDW - For now, only do 10 episodes.
    const episodesToProcess = (
      force ? podcast.Episodes : podcast.Episodes.filter((episode) => !isReady(episode))
    ).slice(0, 10);

    const results = await Promise.all(
      episodesToProcess.map(async (episode) => {
        console.log(`process/podcast - Processing episode ${episode.id}`);
        const result = step.sendEvent('process-episode', {
          name: 'process/episode',
          data: {
            episodeId: episode.id,
            force,
            supabaseAccessToken,
          },
        });
        return result;
      }),
    );

    console.log(`process/episodes for podcast ${podcastId} - Done.`);
    return {
      message: `Finished processing ${results.length} episodes for podcast ${podcastId}`,
    };
  },
);

/** Import or refresh a podcast RSS feed. */
export const ingestPodcast = inngest.createFunction(
  {
    id: 'ingest-podcast',
    retries: 5,
  },
  { event: 'ingest/podcast' },
  async ({ event, step, runId }) => {
    const { podcastId, rssUrl, supabaseAccessToken } = event.data;
    console.log(`ingest/podcast - event ${runId}, podcastId ${podcastId}, rssUrl ${rssUrl}`);

    const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
    let rssFeed = rssUrl;
    if (podcastId) {
      // We are refreshing an existing podcast.
      const podcast = await GetPodcastWithEpisodesByID(supabase, podcastId);
      if (!podcast.rssUrl) {
        throw new Error('Podcast has no RSS feed URL');
      }
      rssFeed = podcast.rssUrl;
    }
    const newPodcast = await Ingest({ supabase, podcastUrl: rssFeed, refresh: !!podcastId });
    if (!!podcastId) {
      return { message: `Refreshed podcast ${podcastId}` };
    } else {
      return { message: `Ingested podcast ${newPodcast.id}` };
    }
  },
);
