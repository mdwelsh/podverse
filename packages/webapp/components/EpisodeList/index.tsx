import { EpisodeCard } from '../EpisodeCard';
import { GetLatestEpisodes } from 'podverse-utils';
import supabase from '@/lib/supabase';

export async function EpisodeList() {
  const episodes = await await GetLatestEpisodes({ supabase, ready: true, limit: 12 });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full md:w-4/5 mx-auto">
      {episodes.map((episode, index) => (
        <EpisodeCard key={index} episode={episode} />
      ))}
    </div>
  );
}
