import { EpisodeCard } from '../EpisodeCard';
import { getLatestEpisodes } from '@/lib/storage';

export async function EpisodeList() {
    const episodes = await (await getLatestEpisodes()).slice(0, 8);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full md:w-4/5 mx-auto">
            {episodes.map((episode, index) => <EpisodeCard key={index} episode={episode} />)}
        </div>
    );

}