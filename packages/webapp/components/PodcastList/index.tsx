import { PodcastCard } from '../PodcastCard';
import { GetPodcasts } from 'podverse-utils';
import { getSupabaseClient } from '@/lib/supabase';

export async function PodcastList({ limit } : { limit?: number }) {
  const supabase = await getSupabaseClient();
  const podcasts = await GetPodcasts(supabase, limit);
  return (
    <div className="mx-auto grid w-full md:w-4/5 grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {podcasts.map((podcast, index) => (
        <PodcastCard key={index} podcast={podcast} />
      ))}
    </div>
  );
}
