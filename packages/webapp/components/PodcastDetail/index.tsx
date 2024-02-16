import supabase from '@/lib/supabase';
import { PodcastWithEpisodes, GetPodcastWithEpisodes } from 'podverse-utils';
import { PodcastEpisodeList } from '@/components/PodcastEpisodeList';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

async function PodcastHeader({ podcast }: { podcast: PodcastWithEpisodes }) {
  return (
    <div className="w-full flex flex-col gap-4 font-mono">
      <div className="w-full flex flex-row gap-4">
        <div className="w-[250px]">{podcast.imageUrl && <img src={podcast.imageUrl} />}</div>
        <div className="w-full flex flex-col gap-4">
          <div className="text-xl font-bold text-primary">
            <Link href={podcast.url || `/podcast/${podcast.slug}`}>
              {podcast.title}
              <ArrowTopRightOnSquareIcon className="text-primary h-4 w-4 ml-1 inline align-super" />
            </Link>
          </div>
          <div className="text-sm font-[Inter]">{podcast.description}</div>
          <div className="text-sm text-muted-foreground flex flex-row gap-4 font-mono">
            <div>{podcast.Episodes.length} episodes</div>
            <div>{podcast.Episodes.filter((episode) => episode.transcriptUrl !== null).length} transcribed</div>
            <div>{podcast.Episodes.filter((episode) => episode.summaryUrl !== null).length} summarized</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodcastChat({ podcast }: { podcast: PodcastWithEpisodes }) {
  return (
    <div className="w-2/5 mt-8 h-[800px] flex flex-col gap-2">
      <div>
        <h1>Chat</h1>
      </div>
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
