/** This module contains Inngest Functions that are invoked in response to Inngest events. */

import { getSupabaseClientWithToken } from '../lib/supabase';
import { inngest } from './client';
import {
  EpisodeStatus,
  Json,
  GetEpisode,
  UpdateEpisode,
  TranscribeEpisode,
  SummarizeEpisode,
  SpeakerIDEpisode,
  EmbedEpisode,
} from 'podverse-utils';

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

    // Set episode status.
    let episode = await GetEpisode(supabase, episodeId);
    episode.status = {
      ...(episode.status as EpisodeStatus),
      startedAt: new Date().toISOString(),
      completedAt: null,
      message: 'Starting processing',
    };
    episode.error = null;
    await UpdateEpisode(supabase, episode);

    try {
      // Start transcription.
      const transcribeResult = await step.run('transcribe', async () => {
        console.log(`process/episode [${episodeId}] - Transcribing`);
        // TODO (mdw): Fill in URL for callback with correct hostname.
        const callbackUrl = `https://deepdocks.tailf7e81.ts.net/api/episode/${episode.id}/transcript`;
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

      // Deepgram will call back to our /api/episode/:episodeId/transcript endpoint,
      // which fires this event to continue processing.
      console.log(`process/episode [${episodeId}] - Waiting for transcript-received event`);
      await step.waitForEvent('transcript-received',
        { event: "process/transcript", timeout: "1h", match: "data.episodeId" });
      console.log(`process/episode [${episodeId}] - Got transcript-received event, continuing`);

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

// OLD VERSION BELOW
// export const processEpisode = inngest.createFunction(
//   {
//     id: 'process-episode',
//     retries: 0,
//     concurrency: {
//       // Limit number of concurrent calls to Deepgram to avoid hitting API limit.
//       limit: 10,
//     },
//   },
//   { event: 'process/episode' },
//   async ({ event, step }) => {
//     const { episodeId, force, supabaseAccessToken } = event.data;
//     if (!episodeId) {
//       throw new Error('process/episode - Missing episodeId in event data');
//     }
//     console.log(`process/episode event received for episodeId ${episodeId}`, event);
//     const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
//     try {
//       const result = await ProcessEpisode({ supabase, episodeId, force });
//       console.log(`process/episode done processing episodeId ${episodeId}`, event);
//       return {
//         event,
//         body: result,
//       };
//     } catch (error) {
//       console.error(`process/episode - Error processing episode ${episodeId}`, error);
//       throw error;
//     }
//   },
// );

// /** Scan for unprocessed episodes and fire off events to process them. */
// export const processEpisodes = inngest.createFunction(
//   { id: 'process-episodes' },
//   { event: 'process/episodes' },
//   async ({ event, step, runId, attempt }) => {
//     const podcastId = event.data.podcastId;
//     const stage = event.data.stage;
//     const repeat = event.data.repeat === true;
//     console.log(
//       `process/episodes - event ${runId} received for ${podcastId}, stage is ${stage}, repeat is ${repeat}, attempt ${attempt}`,
//     );
//     if (stage === undefined || stage === 'transcribe') {
//       const episodes = (await step.run('fetch-episodes-to-transcribe', async () => {
//         let query = supabase
//           .from('Episodes')
//           .select('id')
//           .filter('transcriptUrl', 'is', 'null')
//           .order('pubDate', { ascending: false });
//         if (podcastId) {
//           query = query.eq('podcast', podcastId);
//         }
//         const { data, error } = await query;
//         if (error) {
//           throw new Error('process/episodes - Error fetching episodes: ' + JSON.stringify(error));
//         }
//         if (data === null || data.length === 0) {
//           return { event, body: 'No episodes to transcribe.' };
//         }
//         console.log(`process/episodes - Found ${data.length} episodes to transcribe.`);

//         // To avoid slamming Deepgram, we only process 10 episodes at a time here, but rely on the
//         // event being re-triggered in order to process all episodes.
//         const MAX_EPISODES = 10;
//         const episodes = data.slice(0, MAX_EPISODES);
//         return episodes;
//       })) as any[];

//       const transcribeResults = await Promise.all(
//         episodes.map((episode) =>
//           step.run('transcribe-episode', async () => {
//             console.log(`process/episodes substep - Transcribing episode ${episode.id}`);
//             const result = await TranscribeEpisode(episode.id);
//             console.log(`process/episodes substep - episode ${episode.id} - got result ${result}`);
//             return result;
//           }),
//         ),
//       );

//       console.log(`process/episodes - Done transcribing, got ${transcribeResults.length} results`);
//     }

//     if (stage === undefined || stage === 'summarize') {
//       const episodes = (await step.run('fetch-episodes-to-summarize', async () => {
//         let query = supabase
//           .from('Episodes')
//           .select('id')
//           .not('transcriptUrl', 'is', 'null')
//           .filter('summaryUrl', 'is', 'null')
//           .order('pubDate', { ascending: false });
//         if (podcastId) {
//           query = query.eq('podcast', podcastId);
//         }
//         const { data, error } = await query;
//         if (error) {
//           throw new Error('process/episodes - Error fetching episodes: ' + JSON.stringify(error));
//         }
//         if (data === null || data.length === 0) {
//           return { event, body: 'No episodes to summarize.' };
//         }
//         console.log(`process/episodes - Found ${data.length} episodes to summarize.`);

//         // Only summarize 10 episodes at once.
//         const MAX_EPISODES = 10;
//         const episodes = data.slice(0, MAX_EPISODES);
//         return episodes;
//       })) as any[];

//       const summarizeResults = await Promise.all(
//         episodes.map((episode) =>
//           step.run('summarize-episode', async () => {
//             console.log(`process/episodes substep - Summarizing episode ${episode.id}`);
//             const result = await SummarizeEpisode(episode.id);
//             console.log(`process/episodes substep - episode ${episode.id} - got result ${result}`);
//             return result;
//           }),
//         ),
//       );

//       console.log(`process/episodes - Done summarizing, got ${summarizeResults.length} results`);
//     }

//     // Continue processing.
//     if (repeat) {
//       console.log(`process/episodes - Repeating`);
//       await step.sendEvent('process-episodes', {
//         name: 'process/episodes',
//         data: {
//           podcastId,
//           repeat,
//           stage,
//         },
//       });
//     }

//     console.log('process/episodes - Done.');
//     return {
//       message: 'process/episodes - Done.',
//     };
//   },
// );
