import { getPodcastWithEpisodesByUUID } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export async function ActivatePodcast({ activationCode }: { activationCode: string }) {
  const { userId } = auth();
  if (!userId) {
    return <div>Error: You should already be signed in when accessing this page.</div>;
  }

  const podcast = await getPodcastWithEpisodesByUUID(activationCode);
  if (podcast.owner === userId) {
    // Already owned.
    redirect('/dashboard');
  }
  try {
    await assignPodcastToUser(podcast.id, userId, activationCode);
    redirect('/dashboard?assigned=' + podcast.slug);
  } catch (error) {
    return <div>Unable to activate: {JSON.stringify(error)}</div>;
  }
}
