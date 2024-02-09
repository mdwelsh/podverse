import Link from 'next/link';
import supabase from "@/lib/supabase";
import { Episode, PodcastWithEpisodes, GetPodcastWithEpisodes } from "podverse-utils";
import moment from 'moment';

async function PodcastHeader({ podcast }: { podcast: PodcastWithEpisodes }) {
    return (
        <div className="w-full flex flex-col gap-4">
            <div className="w-full flex flex-row gap-4">
                <div className="w-[250px]">{podcast.imageUrl && <img src={podcast.imageUrl} />}</div>
                <div className="w-full flex flex-col gap-4">
                    <div className="text-xl font-bold text-primary">
                        {podcast.title}
                    </div>
                    <div className="text-sm">
                        {podcast.description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {podcast.Episodes.length} episodes
                    </div>
                </div>
            </div>
        </div>
    );
}

function PodcastEpisodeList({ podcast, episodes }: { podcast: PodcastWithEpisodes, episodes: Episode[] }) {
    return (
        <div className="w-3/5 mt-8 h-[600px] flex flex-col gap-2">
            <div><h1>Episodes</h1></div>
            <div className="w-full flex flex-col p-2 gap-2 text-xs overflow-y-auto h-full">
                {episodes.map((episode, index) => <EpisodeStrip key={index} podcast={podcast} episode={episode} />)}
            </div>
        </div>
    )
}

function EpisodeStrip({ podcast, episode }: { podcast: PodcastWithEpisodes, episode: Episode }) {
    return (
        <Link href={`/podcast/${podcast.slug}/episode/${episode.slug}`}>
            <div className="hover:ring-4 hover:ring-primary flex flex-row gap-4 w-full rounded-lg p-4 border bg-gray-700 dark:bg-gray-700 text-white dark:text-white overflow-hidden">
                <div className="flex flex-row w-full h-full gap-4">
                    <div className="w-1/5">{episode.imageUrl && <img src={episode.imageUrl} />}</div>
                    <div className="w-4/5 text-wrap line-clamp-3 truncate flex flex-col gap-4">
                        <div className="text-sm">{episode.title}</div>
                        <div className="text-xs text-muted-foreground">
                        Published {moment(episode.pubDate).format('MMMM Do YYYY')}
                    </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function PodcastChat({ podcast }: { podcast: PodcastWithEpisodes }) {
    return (
        <div className="w-2/5 mt-8 h-[600px] flex flex-col gap-2">
            <div><h1>Chat</h1></div>
            <div className="w-full border p-4 text-xs overflow-y-auto h-full">
                <div className="text-xs text-muted-foreground">Coming soon</div>
            </div>
        </div>
    );
}

export async function PodcastDetail({ podcastSlug }: { podcastSlug: string }) {
    const podcast = await GetPodcastWithEpisodes(supabase, podcastSlug);

    return (
        <div className="w-4/5 mx-auto mt-8">
            <PodcastHeader podcast={podcast} />
            <div className="flex flex-row gap-4">
                <PodcastEpisodeList podcast={podcast} episodes={podcast.Episodes} />
                <PodcastChat podcast={podcast} />
            </div>
        </div>
    );
}