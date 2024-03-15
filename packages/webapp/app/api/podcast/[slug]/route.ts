import { DeletePodcast, GetPodcast, Ingest } from 'podverse-utils';
import { auth } from '@clerk/nextjs';
import { getSupabaseClient, getSupabaseClientWithToken } from '@/lib/supabase';
import { inngest } from '@/inngest/client';

/** Refresh the RSS feed or process episodes for this Podcast. */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  console.log(`Got POST for podcast ${params.slug}`);
  const { userId, getToken } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { action, force } = await req.json();
  if (action !== 'refresh' && action !== 'process') {
    return new Response('Invalid action', { status: 400 });
  }

  // We need to get the token here since we're going to pass it to Inngest.
  const supabaseAccessToken = await getToken({ template: 'podverse-supabase' });
  if (!supabaseAccessToken) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Check ownership of episode.
  const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
  const podcast = await GetPodcast(supabase, params.slug);
  if (podcast.owner !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (action === 'refresh') {
    console.log(`Refreshing podcast ${params.slug}`);
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
  if (action === 'process') {
    console.log(`Processing podcast ${params.slug}`);
    await inngest.send({
      name: 'process/podcast',
      data: {
        podcastId: podcast.id,
        force,
        supabaseAccessToken,
      },
    });
    return Response.json({ message: `Processing podcast ${params.slug}` });
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
