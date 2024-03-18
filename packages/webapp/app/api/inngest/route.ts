import { serve } from 'inngest/next';
import { inngest } from '../../../inngest/client';
import { processEpisode, processPodcast } from '../../../inngest/functions';

// Allow max duration (can be increased on enterprise plan).
export const maxDuration = 300;

/** These routes are used by Inngest for invoking functions. */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processEpisode, processPodcast],
});
