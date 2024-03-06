import { Ingest } from 'podverse-utils';
import { auth } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';

/** Import the given RSS feed. This does not trigger processing. */
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabase = await getSupabaseClient();
  const { url, refresh } = await req.json();
  console.log(`Importing: ${url}`);
  const podcast = await Ingest({ supabase, podcastUrl: url, refresh });
  return Response.json({ podcast });
}
