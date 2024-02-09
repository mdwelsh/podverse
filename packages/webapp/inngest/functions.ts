import supabase from '../lib/supabase';
import { inngest } from './client';
import { TranscribeEpisode } from '../process/process';

/** Used for testing only. */
export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'test/hello.world' },
  async ({ event, step }) => {
    console.log('test/hello.world event received', event);
    await step.sleep('wait-a-moment', '1s');
    return { event, body: 'Hello, World!' };
  },
);

/** Scan for unprocessed episodes and fire off events to process them. */
export const processEpisodes = inngest.createFunction(
  { id: 'process-episodes' },
  { event: 'process/episodes' },
  async ({ event, step, runId, attempt }) => {
    const podcastSlug = event.data.podcastSlug;
    const repeat = event.data.repeat === true;

    console.log(
      `process/episodes - event ${runId} received for ${podcastSlug}, repeat is ${repeat}, attempt ${attempt}`,
    );

    const episodes = (await step.run('fetch-episodes', async () => {
      let query = supabase.from('Episodes').select('*, podcast(*)').is('transcriptUrl', null);
      if (podcastSlug) {
        console.log(`process/episodes - Fetching episodes for podcast ${podcastSlug}`);
        // XXX Not sure why this isn't working.
        query = query.eq('podcast.slug', podcastSlug);
      }
      const { data, error } = await query
      if (error) {
        throw new Error('process/episodes - Error fetching episodes: ' + JSON.stringify(error));
      }
      if (data === null || data.length === 0) {
        return { event, body: 'No episodes to process.' };
      }
      console.log(`process/episodes - Found ${data.length} episodes to process.`);

      // To avoid slamming Deepgram, we only process 10 episodes at a time here, but rely on the
      // event being re-triggered in order to process all episodes.
      const MAX_EPISODES = 3;
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
        }),
      ),
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
  },
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
  },
);
