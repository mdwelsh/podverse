import { serve } from 'inngest/next';
import { inngest } from '../../../inngest/client';
import { processEpisodes, transcribeEpisode } from '../../../inngest/functions';

// Allow max duration (can be increased on enterprise plan).
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processEpisodes, transcribeEpisode],
});
