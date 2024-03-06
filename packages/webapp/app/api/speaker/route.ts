import { GetEpisodeWithPodcast, UpdateSpeakerMap } from 'podverse-utils';
import { auth } from '@clerk/nextjs';
import supabase from '@/lib/supabase';

/** Update speaker map for a given episode and speaker ID. */
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { episode: episodeId, speaker, name } = await req.json();
  const episode = await GetEpisodeWithPodcast(supabase, episodeId);
  if (episode.podcast.owner !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  await UpdateSpeakerMap(supabase, episodeId, speaker, name);
  console.log(`Updated speaker map for episode ${episodeId}: speaker=${speaker}, name=${name}`);
  return Response.json({});
}
