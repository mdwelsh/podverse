import { serve } from 'inngest/next';
import { inngest } from '../../../inngest/client';
import { helloWorld, processEpisodes, transcribeEpisode } from '../../../inngest/functions';

// Allow max duration (can be increased on enterprise plan).
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, processEpisodes, transcribeEpisode],
});
