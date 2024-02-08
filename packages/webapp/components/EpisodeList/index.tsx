import { Episode, Podcast } from 'podverse-types';
import { EpisodeCard } from '../EpisodeCard';
import { getEpisodesWithPodcast } from '@/lib/storage';

export async function EpisodeList() {

    const episodes = await getEpisodesWithPodcast();
    return (
        <div className="grid grid-cols-4">
            {episodes.map(episode => (
                <EpisodeCard episode={episode} />
            ))}
        </div>
    );

}