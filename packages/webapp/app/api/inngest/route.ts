import { serve } from 'inngest/next';
import { inngest } from '../../../inngest/client';
import { helloWorld, processEpisodes, transcribeEpisode } from '../../../inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, processEpisodes, transcribeEpisode],
});
