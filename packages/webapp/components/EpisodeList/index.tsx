import { EpisodeCard } from '../EpisodeCard';
import { GetLatestEpisodes } from 'podverse-utils';
import { getSupabaseClient } from '@/lib/supabase';

export async function EpisodeList() {
  const supabase = await getSupabaseClient();
  const episodes = await await GetLatestEpisodes({ supabase, limit: 12 });

  return (
    <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 w-full md:w-4/5">
      {episodes.map((episode, index) => (
        <EpisodeCard key={index} episode={episode} />
      ))}
    </div>
  );
}
