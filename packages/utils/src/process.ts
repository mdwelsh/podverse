import { Inngest } from 'inngest';

export async function ProcessPodcast({
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
