import { ReadPodcastFeed } from 'podverse-utils';
import { auth } from '@clerk/nextjs';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { url, provisional } = await req.json();
  console.log(`Importing: ${url}`);
  if (provisional) {
    const podcast = await ReadPodcastFeed(url);
    console.log('Podcast: ', podcast);
    return Response.json({ podcast });
  } else {
    throw new Error('Not implemented');
  }
}
