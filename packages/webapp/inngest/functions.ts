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
  GetEpisodeWithPodcast,
  EpisodeWithPodcast,
  EpisodeWithPodcastToEpisode,
  ClearPodcastErrors,
  isReady,
} from 'podverse-utils';
import { TranscribeEpisode, SummarizeEpisode, SpeakerIDEpisode, EmbedEpisode, SuggestEpisode } from '@/lib/process';
import { sendEmail } from '@/lib/email';
import { userPrimaryEmailAddress } from '@/lib/users';

// Used when running locally - use `tailscale serve`.
const DEVELOPMENT_SERVER_HOSTNAME = 'deepdocks.tailf7e81.ts.net';

/** Return false if the user's plan does not permit processing of this Episode. */
async function checkUserPlanLimit(supabase: SupabaseClient, episode: EpisodeWithPodcast): Promise<boolean> {
  const podcastStats = await GetPodcastStats(supabase);
  const subscription = await GetCurrentSubscription(supabase, episode.podcast.owner || undefined);
  let plan = PLANS.free;
  if (subscription) {
    plan = PLANS[subscription.plan as keyof typeof PLANS];
  }
  const stat = podcastStats.find((p) => p.id === episode.podcast.id);
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
    let episodeWithPodcast = await GetEpisodeWithPodcast(supabase, episodeId);
    let episode = EpisodeWithPodcastToEpisode(episodeWithPodcast);

    // Check plan limit and bail out if we've hit it.
    if (!checkUserPlanLimit(supabase, episodeWithPodcast)) {
      console.log(`process/episode - Plan limit reached for episode ${episodeId}`);
      sendEmail({
        to: userPrimaryEmailAddress(episodeWithPodcast.podcast.owner) || undefined,
        subject: `Plan limit reached for podcast ${episodeWithPodcast.podcast.title}`,
        text: `We were unable to process an episode of ${episodeWithPodcast.podcast.title}, since your account has reached its plan limit. Please upgrade your plan to continue processing episodes.\n`,
      });
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

    const currentHostname = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? DEVELOPMENT_SERVER_HOSTNAME;

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
          if: `async.data.episodeId == ${episodeId} || async.data.episodeId == '${episodeId}'`,
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
      let email = `Finished processing episode: ${episode.title}\n\n`;
      email += JSON.stringify(transcribeResult, null, 2) + '\n\n';
      email += JSON.stringify(summarizeResult, null, 2) + '\n\n';
      email += JSON.stringify(speakerIdResult, null, 2) + '\n\n';
      email += JSON.stringify(suggestionResult, null, 2) + '\n\n';
      email += JSON.stringify(embedResult, null, 2) + '\n\n';
      await sendEmail({
        to: userPrimaryEmailAddress(episodeWithPodcast.podcast.owner) || undefined,
        subject: `Finished processing ${episode.title}`,
        text: email,
      });
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
      await sendEmail({
        to: userPrimaryEmailAddress(episodeWithPodcast.podcast.owner) || undefined,
        subject: `Error processing episode: ${episode.title}`,
        text: JSON.stringify(error, null, 2),
      });
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
    const { podcastId, force, supabaseAccessToken, episodes, episodeLimit, maxEpisodes } = event.data;
    console.log(
      `process/podcast - event ${runId} received for ${podcastId}, force ${force}, episodeLimit ${episodeLimit}`,
    );
    const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
    const podcast = await GetPodcastWithEpisodesByID(supabase, podcastId);
    let cap = episodeLimit;
    if (maxEpisodes && !force) {
      let processedEpisodes = podcast.Episodes.filter((episode) => isReady(episode)).length;
      cap = Math.max(0, maxEpisodes - processedEpisodes);
      console.log(
        `process/podcast - Podcast ${podcastId} has ${processedEpisodes}, max is ${maxEpisodes}, cap is ${cap}`,
      );
    }
    let episodesToProcess = force
      ? podcast.Episodes
      : podcast.Episodes.filter((episode) => (episodes ? episodes.includes(episode.id) : !isReady(episode)));
    if (episodeLimit) {
      console.log(
        `process/podcast - Podcast ${podcastId} has ${episodesToProcess.length} episodes to process, capping to ${cap}`,
      );
      episodesToProcess = episodesToProcess.slice(0, cap);
    }
    console.log(`process/podcast - Podcast ${podcastId}, processing ${episodesToProcess.length} episodes`);
    const results = await Promise.all(
      episodesToProcess.map(async (episode) => {
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
    const email = `Finished processing ${episodesToProcess.length} episodes from ${podcast.title}.\n\n${JSON.stringify(results, null, 2)}\n`;
    await sendEmail({
      to: userPrimaryEmailAddress(podcast.owner) || undefined,
      subject: `Finished processing ${podcast.title}`,
      text: email,
    });

    console.log(`process/podcast for podcast ${podcastId} - Done.`);
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
    let originalEpisodes: Episode[] = [];
    if (podcastId) {
      // We are refreshing an existing podcast.
      console.log(`ingest/podcast - Refreshing existing podcast ${podcastId}`);
      const podcast = await GetPodcastWithEpisodesByID(supabase, podcastId);
      if (!podcast.rssUrl) {
        throw new Error('Podcast has no RSS feed URL');
      }
      originalEpisodes = podcast.Episodes;
      rssFeed = podcast.rssUrl;
    }
    const newPodcast = await Ingest({ supabase, podcastUrl: rssFeed, refresh: !!podcastId });
    if (newPodcast.process) {
      const newEpisodes = newPodcast.Episodes.filter((episode) => !originalEpisodes.find((e) => e.id === episode.id));
      console.log(`ingest/podcast - Processing podcast ${newPodcast.id} with ${newEpisodes.length} new episodes`);
      const result = step.sendEvent('process-podcast', {
        name: 'process/podcast',
        data: {
          podcastId: newPodcast.id,
          supabaseAccessToken,
          episodes: newEpisodes.map((episode) => episode.id),
        },
      });
      return result;
    }
    if (!!podcastId) {
      return { message: `Refreshed podcast ${podcastId}` };
    } else {
      return { message: `Ingested podcast ${newPodcast.id}` };
    }
  },
);

/** Clear errors and processing state for a podcast. */
export const clearErrors = inngest.createFunction(
  {
    id: 'clear-errors',
    retries: 5,
  },
  { event: 'clear/errors' },
  async ({ event, step, runId }) => {
    const { podcastId, supabaseAccessToken } = event.data;
    console.log(`clear/errors - event ${runId}, podcastId ${podcastId}`);
    const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
    await ClearPodcastErrors({ supabase, podcastId });
    return { message: `Cleared errors for podcast ${podcastId}` };
  },
);

/** Refresh all podcast feeds. Runs daily. */
export const refreshPodcasts = inngest.createFunction(
  {
    id: 'refresh-podcasts',
    retries: 5,
  },
  { cron: '0 1 * * *' }, // Run daily at 1am UTC
  async ({ step }) => {
    console.log(`refreshPodcasts - Starting`);
    const supabase = await getSupabaseClientWithToken(process.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const stats = await GetPodcastStats(supabase);

    console.log(`refreshPodcasts - Clearing errors for ${stats.length} podcasts`);
    await Promise.all(
      stats.map(async (stat) => {
        console.log(`refreshPodcasts - Clearing podcast ${stat.id}`);
        const result = step.sendEvent('clear-errors', {
          name: 'clear/errors',
          data: {
            podcastId: stat.id,
            supabaseAccessToken: process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
        });
        return result;
      }),
    );
    console.log(`refreshPodcasts - Done clearing errors.`);

    console.log(`refreshPodcasts - Refreshing ${stats.length} podcasts`);
    const results = await Promise.all(
      stats.map(async (stat) => {
        console.log(`refreshPodcasts - Refreshing podcast ${stat.id}`);
        const result = step.sendEvent('ingest-podcast', {
          name: 'ingest/podcast',
          data: {
            podcastId: stat.id,
            supabaseAccessToken: process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
        });
        return result;
      }),
    );
    console.log(`refreshPodcasts - Done ingesting.`);

    // console.log(`refreshPodcasts - Processing ${stats.length} podcasts`);
    // await Promise.all(
    //   stats.map(async (stat) => {
    //     console.log(`refreshPodcasts - Processing podcast ${stat.id}`);
    //     const result = step.sendEvent('process-podcast', {
    //       name: 'process/podcast',
    //       data: {
    //         podcastId: stat.id,
    //         supabaseAccessToken: process.env.SUPABASE_SERVICE_ROLE_KEY,
    //       },
    //     });
    //     return result;
    //   }),
    // );
    // console.log(`refreshPodcasts - Done processing.`);

    await sendEmail({
      subject: 'Daily podcast refresh job completed',
      text: `Finished refreshing ${stats.length} podcasts:\n\n${JSON.stringify(results, null, 2)}\n`,
    });
    return {
      message: `Finished refreshing ${stats.length} podcasts`,
    };
  },
);
