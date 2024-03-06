import { ReadPodcastFeed } from 'podverse-utils';
import { auth } from '@clerk/nextjs';

/**
 * Return a preview of the given podcast RSS URL.
 * This is used only for previewing the podcast before importing it.
 */
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { url } = await req.json();
  console.log(`Previewing: ${url}`);
  const podcast = await ReadPodcastFeed(url);
  return Response.json({ podcast });
}
