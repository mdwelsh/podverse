import { Ingest } from 'podverse-utils';
import { auth } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';

//   "process" - Given a Podcast ID, trigger Inngest processing for episodes in the podcast.

/** Import the given RSS feed. */
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabase = await getSupabaseClient();
  const { url, refresh, process } = await req.json();
  console.log(`Importing: ${url}`);
  const podcast = await Ingest({ supabase, podcastUrl: url, refresh });

  if (process) {
    // TODO(mdw): Trigger processing.
  }

  return Response.json({ podcast });
}
