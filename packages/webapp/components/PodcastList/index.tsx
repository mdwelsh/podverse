import { PodcastCard } from '../PodcastCard';
import { GetPodcasts } from 'podverse-utils';
import { getSupabaseClient } from '@/lib/supabase';

export async function PodcastList() {
  const podcasts = await GetPodcasts(await getSupabaseClient());
  return (
    <div className="grid grid-cols-4 w-full md:w-4/5 mx-auto gap-4">
      {podcasts.map((podcast, index) => (
        <PodcastCard key={index} podcast={podcast} />
      ))}
    </div>
  );
}
