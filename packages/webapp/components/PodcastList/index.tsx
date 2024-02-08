import { Podcast } from 'podverse-types';
import { PodcastCard } from '../PodcastCard';
import { getPodcasts } from '@/lib/storage';

export async function PodcastList() {

    const podcasts = await getPodcasts();
    return (
        <div className="grid grid-cols-4">
            {podcasts.map(podcast => (
                <PodcastCard podcast={podcast} />
            ))}
        </div>
    );

}