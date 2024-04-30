import { getSupabaseClient } from '@/lib/supabase';
import { PodcastWithEpisodes, GetPodcastWithEpisodes, GetPodcastWithEpisodesByUUID, isReady } from 'podverse-utils';
import { PodcastEpisodeList } from '@/components/PodcastEpisodeList';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon, RssIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { ContextAwareChat } from '@/components/Chat';
import { ChatContextProvider } from '@/components/ChatContext';
import { getEpisodeLimit } from '@/lib/actions';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';

async function PodcastHeader({ podcast }: { podcast: PodcastWithEpisodes }) {
  const planLimit = await getEpisodeLimit(podcast.id);
  return (
    <div className="flex w-full flex-col gap-4 font-mono">
      <div className="flex w-full flex-row gap-4">
        <div className="flex w-[250px] flex-col gap-2">
          <div>
            {podcast.imageUrl && <Image src={podcast.imageUrl} alt="Podcast thumbnail" width={400} height={400} />}
          </div>
          {planLimit && (
            <div className="mt-2 w-fit">
              {planLimit && <ManagePodcastDialog podcast={podcast} planLimit={planLimit} />}
            </div>
          )}
        </div>
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="text-muted-foreground col-span-3 font-mono text-sm md:col-span-1">
                <div>{podcast.Episodes.length} episodes</div>
              </div>
              <PodcastLinks podcast={podcast} />
            </div>
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

function PodcastLinkHeader({ podcast }: { podcast: PodcastWithEpisodes }) {
  const { userId } = auth();
  if (!userId || userId !== podcast.owner) {
    return null;
  }
  const link = `/podcast/${podcast.slug}-${podcast.uuid?.replace(/-/g, '')}`;
  if (podcast.private) {
    return (
      <div className="flex flex-row bg-red-900 p-2 text-center text-white">
        <div className="mx-auto w-full">
          <div className="flex flex-col gap-3">
            <div className="font-mono">You are viewing a private link to this podcast.</div>
            <div className="text-sm">
              The content here is only visible through the{' '}
              <Link href={link} className="text-primary underline">
                private link
              </Link>{' '}
              and is intended as a preview.
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-row bg-muted p-2 text-center text-white">
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-3">
          <div className="font-mono text-sm">This podcast is public at the link:</div>
          <div className="font-mono text-primary">https://podverse.ai/podcast/{podcast.slug}</div>
        </div>
      </div>
    </div>
  );
}

export async function PodcastDetail({ podcastSlug }: { podcastSlug: string }) {
  try {
    const supabase = await getSupabaseClient();

    let podcast = null;
    try {
      podcast = await GetPodcastWithEpisodes(supabase, podcastSlug);
      if (podcast.private) {
        throw new Error('Podcast is private');
      }
    } catch (error) {
      // See if the slug contains a UUID.
      const uuid = podcastSlug.split('-').pop();
      if (uuid && uuid.length == 32) {
        podcast = await GetPodcastWithEpisodesByUUID(supabase, uuid);
      } else {
        throw error;
      }
    }

    return (
      <ChatContextProvider podcast={podcast}>
        <PodcastLinkHeader podcast={podcast} />
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
