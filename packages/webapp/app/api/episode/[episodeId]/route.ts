import { ReadPodcastFeed } from 'podverse-utils';
import { auth } from '@clerk/nextjs';
import { inngest } from '@/inngest/client';

/** Process the given episode. */
export async function POST(req: Request, { episodeId }: { episodeId: string }) {
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { force } = await req.json();
  console.log(`Refreshing episode ID: ${episodeId}`);
  await inngest.send({
    name: 'process/episode',
    data: {
      episodeId: parseInt(episodeId),
      force
    },
  });
  return Response.json({ message: `Processing episode ${episodeId}` });
}
