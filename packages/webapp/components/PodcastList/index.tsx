import { Podcast } from 'podverse-utils';
import { PodcastCard } from '../PodcastCard';
import { getPodcasts } from '@/lib/storage';

export async function PodcastList() {
    const podcasts = await getPodcasts();
    return (
        <div className="grid grid-cols-4 w-full md:w-4/5 mx-auto gap-4">
            {podcasts.map((podcast, index) => (
                <PodcastCard key={index} podcast={podcast} />
            ))}
        </div>
    );

}