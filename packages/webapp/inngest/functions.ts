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
  async ({ event, step }) => {
    console.log('process/episodes event received', event);
    const { data, error } = await supabase.from('Episodes').select('*').filter('transcriptUrl', 'is', null);
    if (error) {
      throw new Error('process/episodes - Error fetching episodes: ' + error);
    }
    if (data === null || data.length === 0) {
      return { event, body: 'No episodes to process.' };
    }
    for (const episode of data) {
      console.log('Processing episode', episode.id);
      await inngest.send({
        name: 'process/transcribe',
        data: {
          episodeId: episode.id,
        },
      });
    }
    console.log(`process/episodes - Sent transcribe events for ${data.length} episodes.`);
    return {
      event,
      body: `process/episodes - Sent transcribe events for ${data.length} episodes.`,
    };
  },
);

/** Transcribe an episode. */
export const transcribeEpisode = inngest.createFunction(
  {
    id: 'process-transcribe',
    concurrency: {
      // Limit number of concurrent calls to Deepgram to avoid hitting API limit.
      limit: 4,
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
