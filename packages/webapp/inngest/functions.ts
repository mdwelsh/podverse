/** This module contains Inngest Functions that are invoked in response to Inngest events. */

import { getSupabaseClient } from '../lib/supabase';
import { inngest } from './client';
import { ProcessEpisode } from 'podverse-utils';

/** Process a single episode. */
export const processEpisode = inngest.createFunction(
  {
    id: 'process-episode',
    concurrency: {
      // Limit number of concurrent calls to Deepgram to avoid hitting API limit.
      limit: 10,
    },
  },
  { event: 'process/episode' },
  async ({ event, step }) => {
    const { episodeId, force } = event.data;
    if (!episodeId) {
      throw new Error('process/episode - Missing episodeId in event data');
    }
    console.log(`process/episode event received for episodeId ${episodeId}`, event);
    const supabase = await getSupabaseClient();
    const result = await ProcessEpisode({ supabase, episodeId, force });
    console.log(`process/episode done processing episodeId ${episodeId}`, event);
    return {
      event,
      body: result,
    };
  },
);

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
