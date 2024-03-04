/** This module has functions to interface to Inngest for offline processing. */

import { Inngest } from 'inngest';

/** Send an event to process the given podcast. */
export async function SendProcessPodcastEvent({
  podcastId,
  repeat,
  stage,
}: {
  podcastId?: string;
  repeat?: boolean;
  stage?: string;
}) {
  const eventKey: string | undefined = process.env.INNGEST_EVENT_KEY;
  const inngest = new Inngest({ id: 'podverse-app', eventKey });
  await inngest.send({
    name: 'process/episodes',
    data: {
      podcastId,
      repeat,
      stage,
    },
  });
}
