import { PodcastCard } from '../PodcastCard';
import { GetPodcasts } from 'podverse-utils';
import { getSupabaseClient } from '@/lib/supabase';

export async function PodcastList({ limit } : { limit?: number }) {
  const supabase = await getSupabaseClient();
  const podcasts = await GetPodcasts(supabase, limit);
  return (
    <div className="grid grid-cols-4 w-full lg:grid-cols-5 mx-auto gap-4">
      {podcasts.map((podcast, index) => (
        <PodcastCard key={index} podcast={podcast} />
      ))}
    </div>
  );
}
