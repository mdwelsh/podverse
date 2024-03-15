import { DeletePodcast, GetPodcast, Ingest } from 'podverse-utils';
import { auth } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';

/** Refresh the RSS feed for this Podcast. This does not trigger processing. */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  console.log(`Got POST for podcast ${params.slug}`);
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabase = await getSupabaseClient();
  const podcast = await GetPodcast(supabase, params.slug);
  if (podcast.owner !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!podcast.rssUrl) {
    return new Response('Podcast has no RSS feed URL', { status: 400 });
  }
  try {
    const updated = await Ingest({ supabase, podcastUrl: podcast.rssUrl, refresh: true });
    console.log(`Refreshed podcast ${params.slug}`);
    return Response.json(updated);
  } catch (e) {
    console.error(`Error ingesting podcast: ${JSON.stringify(e)}`);
    return new Response(`Error ingesting podcast: ${(e as { message: string }).message}`, { status: 500 });
  }
}

/** Delete the given podcast. */
export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  console.log(`Got DELETE for podcast ${params.slug}`);
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabase = await getSupabaseClient();
  await DeletePodcast(supabase, params.slug);
  return new Response(`Deleted podcast ${params.slug}`, { status: 200 });
}
