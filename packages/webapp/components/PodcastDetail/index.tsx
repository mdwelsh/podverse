import { getSupabaseClient } from '@/lib/supabase';
import { PodcastWithEpisodes, GetPodcastWithEpisodes } from 'podverse-utils';
import { PodcastEpisodeList } from '@/components/PodcastEpisodeList';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon, RssIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';
import { Owner } from '@/components/Owner';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { ContextAwareChat } from '@/components/Chat';
import { ChatContextProvider } from '@/components/ChatContext';
import { isReady } from '@/lib/episode';

async function PodcastHeader({ podcast }: { podcast: PodcastWithEpisodes }) {
  return (
    <div className="flex w-full flex-col gap-4 font-mono">
      <div className="flex w-full flex-row gap-4">
        <div className="w-[250px]">{podcast.imageUrl && <img src={podcast.imageUrl} />}</div>
        <div className="flex w-full flex-col gap-4">
          <div className="text-primary text-2xl font-bold">
            <Link href={podcast.url || `/podcast/${podcast.slug}`}>
              {podcast.title}
              <ArrowTopRightOnSquareIcon className="text-primary ml-1 inline size-4 align-super" />
            </Link>
          </div>
          <div className="font-sans text-sm">{podcast.description}</div>
          {podcast.copyright && <div className="text-muted-foreground font-mono text-sm">{podcast.copyright}</div>}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="text-muted-foreground col-span-3 font-mono text-sm md:col-span-1">
                <div>{podcast.Episodes.length} episodes</div>
              </div>
              <PodcastLinks podcast={podcast} />
            </div>
            <Owner owner={podcast.owner}>
              <div className="mt-2 w-fit">
                <ManagePodcastDialog podcast={podcast} />
              </div>
            </Owner>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodcastLinks({ podcast }: { podcast: PodcastWithEpisodes }) {
  return (
    <>
      {podcast.url && (
        <div className="text-primary text-sm underline">
          <a href={podcast.url} target="_blank" rel="noreferrer">
            <GlobeAmericasIcon className="text-foreground mx-1 inline size-4" />
            Website
          </a>
        </div>
      )}
      {podcast.rssUrl && (
        <div className="text-primary text-sm underline">
          <a href={podcast.rssUrl} target="_blank" rel="noreferrer">
            <RssIcon className="text-foreground mx-1 inline size-4" />
            RSS feed
          </a>
        </div>
      )}
    </>
  );
}

export function PodcastChat({ podcast }: { podcast: PodcastWithEpisodes }) {
  if (!podcast.suggestions || podcast.suggestions.length === 0) {
    return (
      <div className="mt-8 flex h-[800px] w-2/5 flex-col gap-2">
        <div>
          <h1>Chat</h1>
        </div>
        <div className="size-full overflow-y-auto border p-4 font-mono text-sm">Chat not available</div>
      </div>
    );
  }

  return (
    <div className="mt-8 hidden h-[800px] w-2/5 flex-col gap-2 lg:flex">
      <div>
        <h1>Chat</h1>
      </div>
      <div className="size-full overflow-y-auto border p-4 text-xs">
        <ContextAwareChat />
      </div>
    </div>
  );
}

export async function PodcastDetail({ podcastSlug }: { podcastSlug: string }) {
  try {
    const supabase = await getSupabaseClient();
    const podcast = await GetPodcastWithEpisodes(supabase, podcastSlug);
    return (
      <ChatContextProvider podcast={podcast}>
        <div className="mx-auto mt-8 w-11/12 md:w-4/5">
          <PodcastHeader podcast={podcast} />
          <div className="flex flex-row gap-4">
            <PodcastEpisodeList podcast={podcast} episodes={podcast.Episodes} />
            {podcast.Episodes.filter(isReady).length > 0 && <PodcastChat podcast={podcast} />}
          </div>
        </div>
      </ChatContextProvider>
    );
  } catch (error) {
    console.error('Error looking up podcast:', error);
    return (
      <div className="mx-auto mt-8 flex w-full flex-col gap-4 font-mono md:w-4/5">
        <div>
          Failed to load podcast <span className="text-primary">{podcastSlug}</span>
        </div>
        <div>
          <Link className="text-primary font-mono underline" href="/">
            Go home
          </Link>
        </div>
      </div>
    );
  }
}
