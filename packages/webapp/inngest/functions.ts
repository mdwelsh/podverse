import supabase from '../lib/supabase';
import { inngest } from './client';
import { TranscribeEpisode, SummarizeEpisode } from '../process/process';

/** Scan for unprocessed episodes and fire off events to process them. */
export const processEpisodes = inngest.createFunction(
  { id: 'process-episodes' },
  { event: 'process/episodes' },
  async ({ event, step, runId, attempt }) => {
    const podcastSlug = event.data.podcastSlug;
    const repeat = event.data.repeat === true;

    console.log(
      `process/episodes - event ${runId} received for ${podcastSlug}, repeat is ${repeat}, attempt ${attempt}`
    );
    const episodes = (await step.run('fetch-episodes', async () => {
      let query = supabase.from('Episodes').select('id').filter('transcriptUrl', 'is', 'null');
      if (podcastSlug) {
        console.log(`process/episodes - Filtering by podcast ${podcastSlug}`);
        const { data, error } = await supabase.from('Podcasts').select('id').eq('slug', podcastSlug).limit(1);
        if (error) {
          throw new Error('process/episodes - Error fetching podcast: ' + JSON.stringify(error));
        }
        if (data === null || data.length === 0) {
          return { event, body: `Podcast ${podcastSlug} not found.` };
        }
        query = query.eq('podcast', data[0].id);
      }
      const { data, error } = await query;
      if (error) {
        throw new Error('process/episodes - Error fetching episodes: ' + JSON.stringify(error));
      }
      if (data === null || data.length === 0) {
        return { event, body: 'No episodes to process.' };
      }
      console.log(`process/episodes - Found ${data.length} episodes to process.`);

      // To avoid slamming Deepgram, we only process 10 episodes at a time here, but rely on the
      // event being re-triggered in order to process all episodes.
      const MAX_EPISODES = 10;
      const episodes = data.slice(0, MAX_EPISODES);
      return episodes;
    })) as any[];

    console.log(`process/episodes - Fetched ${episodes.length} episodes.`);

    const transcribeResults = await Promise.all(
      episodes.map((episode) =>
        step.run('transcribe-episode', async () => {
          console.log(`process/episodes substep - Transcribing episode ${episode.id}`);
          const result = await TranscribeEpisode(episode.id);
          console.log(`process/episodes substep - episode ${episode.id} - got result ${result}`);
          return result;
        })
      )
    );

    console.log(`process/episodes - Done transcribing, got ${transcribeResults.length} results`);

    // Continue processing.
    if (repeat) {
      console.log(`process/episodes - Repeating`);
      await step.sendEvent('process-episodes', {
        name: 'process/episodes',
        data: {
          podcastSlug,
          repeat,
        },
      });
    }

    console.log(`process/episodes - Done processing ${episodes.length} episodes.`);
    return {
      message: `process/episodes - Processed ${episodes.length} episodes.`,
      transcribeResults,
    };
  }
);

/** Transcribe a single episode. */
export const transcribeEpisode = inngest.createFunction(
  {
    id: 'process-transcribe',
    concurrency: {
      // Limit number of concurrent calls to Deepgram to avoid hitting API limit.
      limit: 10,
    },
  },
  { event: 'process/transcribe' },
  async ({ event, step }) => {
    const { episodeId } = event.data;
    console.log(`process/transcribe event received for episodeId ${episodeId}`, event);
    const result = await TranscribeEpisode(episodeId);
    return {
      event,
      body: result,
    };
  }
);

/** Summarize a single episode. */
export const summarizeEpisode = inngest.createFunction(
  {
    id: 'process-summarize',
    concurrency: {
      // Limit number of concurrent calls to avoid hitting API limits.
      limit: 10,
    },
  },
  { event: 'process/summarize' },
  async ({ event, step }) => {
    const { episodeId } = event.data;
    console.log(`process/summarize event received for episodeId ${episodeId}`, event);
    const result = await SummarizeEpisode(episodeId);
    return {
      event,
      body: result,
    };
  }
);
