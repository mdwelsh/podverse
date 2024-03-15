import { getSupabaseClientWithToken } from '@/lib/supabase';
import { GetEpisodeWithPodcast } from 'podverse-utils';
import { auth } from '@clerk/nextjs';
import { inngest } from '@/inngest/client';

/** Process the given episode. */
export async function POST(req: Request, { params }: { params: { episodeId: string } }) {
  console.log(`Got POST request for episode: ${params.episodeId}`);
  const { userId, getToken } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { force } = await req.json();

  // We need to get the token here since we're going to pass it to Inngest.
  const supabaseAccessToken = await getToken({ template: 'podverse-supabase' });
  if (!supabaseAccessToken) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Check ownership of episode.
  const supabase = await getSupabaseClientWithToken(supabaseAccessToken);
  try {
    const episode = await GetEpisodeWithPodcast(supabase, parseInt(params.episodeId));
    if (episode.podcast.owner !== userId) {
      return new Response('Forbidden', { status: 403 });
    }
  } catch (error) {
    console.error('Error fetching episode', error);
    return new Response('Not found', { status: 404 });
  }
  console.log(`Refreshing episode ID: ${params.episodeId}`);
  await inngest.send({
    name: 'process/episode',
    data: {
      episodeId: parseInt(params.episodeId),
      force,
      supabaseAccessToken,
    },
  });
  return Response.json({ message: `Processing episode ${params.episodeId}` });
}
