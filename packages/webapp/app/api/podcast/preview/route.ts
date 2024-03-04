import { ReadPodcastFeed } from 'podverse-utils';
import { auth } from '@clerk/nextjs';

// TODO(mdw): This needs to be reworked to support three different operations:
//   "preview" - Given an RSS feed URL, read the feed and return the podcast metadata.
//               Nothing is written to the database.
//   "import" - Given an RSS feed URL, read the feed and create a new Podcast entry
//              in the database, and create new Episode entries for each episode in the feed.
//              Additionally trigger Inngest processing for the Podcast.
//   "process" - Given a Podcast ID, trigger Inngest processing for episodes in the podcast.

/** Return a preview of the given podcast RSS URL. */
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
