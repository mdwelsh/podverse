import { Podcast } from 'podverse-types';
import { PodcastCard } from '../PodcastCard';
import { getPodcasts } from '@/lib/storage';

export async function PodcastList() {
    const podcasts = await getPodcasts();
    return (
        <div className="grid grid-cols-4 w-full md:w-4/5 mx-auto">
            {podcasts.map(podcast => (
                <PodcastCard podcast={podcast} />
            ))}
        </div>
    );

}