import { getSupabaseClient } from '@/lib/supabase';
import { PodcastWithEpisodes, GetPodcastWithEpisodes, GetPodcastWithEpisodesByUUID, isReady } from 'podverse-utils';
import { PodcastEpisodeList } from '@/components/PodcastEpisodeList';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon, RssIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { AcceptPodcastDialog } from '../AcceptPodcastDialog';
import { ContextAwareChat } from '@/components/Chat';
import { getEpisodeLimit } from '@/lib/actions';
import { EpisodeLimit } from '@/lib/limits';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import { ChatContextProvider } from '../ChatContext';
import { ShareButtons } from '@/components/ShareButtons';

async function PodcastHeader({ podcast, planLimit }: { podcast: PodcastWithEpisodes; planLimit: EpisodeLimit | null }) {
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
          <span className="text-muted-foreground text-sm">
            {podcast.Episodes.filter(isReady).length > 0 && (
              <span>{podcast.Episodes.filter(isReady).length} episodes processed / </span>
            )}
            {podcast.Episodes.length} total
          </span>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <PodcastLinks podcast={podcast} />
              <ShareButtons />
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
        <ChatContextProvider>
          <ContextAwareChat />
        </ChatContextProvider>
      </div>
    </div>
  );
}

function PodcastLinkHeader({
  podcast,
  planLimit,
  activationCode,
}: {
  podcast: PodcastWithEpisodes;
  planLimit: EpisodeLimit | null;
  activationCode?: string;
}) {
  const { userId } = auth();
  const numEpisodes = podcast.Episodes.filter(isReady).length;
  const link = `/podcast/${podcast.slug}?uuid=${podcast.uuid?.replace(/-/g, '')}`;
  if (podcast.private) {
    if (activationCode && (!userId || userId !== podcast.owner)) {
      return (
        <div className="flex flex-row bg-sky-900 p-4 text-center text-white">
          <div className="mx-auto w-3/5">
            <div className="flex flex-col gap-3">
              <div className="font-mono underline underline-offset-8">Thanks for checking out Podverse!</div>
              <div className="text-pretty text-base">
                This page is a <b>private</b> demo of Podverse for <b className="text-primary">{podcast.title}</b>.
                We&apos;ve imported {numEpisodes} recent episodes to get started. Feel free to click around and try out
                all the features.
              </div>
              <div className="text-pretty text-base">
                As part of our initial launch, you&apos;re invited to claim a <b>one-year free subscription</b> to
                Podverse &mdash; no strings attached. Just click below and we&apos;ll set up your free account, after
                which you can manage your podcast, import more episodes, and share links with your listeners.
              </div>
              <AcceptPodcastDialog podcast={podcast} />
            </div>
          </div>
        </div>
      );
    } else {
      if (!userId || userId !== podcast.owner) {
        return null;
      }
      return (
        <div className="flex flex-row bg-red-900 p-2 text-center text-white">
          <div className="mx-auto w-full">
            <div className="flex flex-col gap-3">
              <div className="font-mono">This podcast is not yet published.</div>
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
  }
  return (
    <div className="bg-muted flex flex-row p-2 text-center text-white">
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-3">
          <div className="font-mono text-sm">This podcast is public at the link:</div>
          <div className="text-primary font-mono">https://podverse.ai/podcast/{podcast.slug}</div>
        </div>
      </div>
    </div>
  );
}

export async function PodcastDetail({
  podcastSlug,
  uuid,
  activationCode,
}: {
  podcastSlug: string;
  uuid?: string;
  activationCode?: string;
}) {
  try {
    const supabase = await getSupabaseClient();

    let podcast = null;
    podcast = await GetPodcastWithEpisodes(supabase, podcastSlug);
    if (podcast.private && podcast.uuid) {
      if (uuid) {
        if (uuid !== podcast.uuid.replace(/-/g, '')) {
          throw new Error('Podcast is private and UUID does not match');
        }
      } else if (activationCode) {
        if (activationCode !== podcast.uuid.replace(/-/g, '')) {
          throw new Error('Podcast is private and activation code does not match');
        }
      } else {
        throw new Error('Podcast is private and no UUID or activation code provided');
      }
    }
    const planLimit = await getEpisodeLimit(podcast.id);

    return (
      <>
        <PodcastLinkHeader podcast={podcast} planLimit={planLimit} activationCode={activationCode} />
        <div className="mx-auto mt-8 w-11/12 md:w-4/5">
          <PodcastHeader podcast={podcast} planLimit={planLimit} />
          <div className="flex flex-row gap-4">
            <PodcastEpisodeList podcast={podcast} episodes={podcast.Episodes} />
            {podcast.Episodes.filter(isReady).length > 0 && <PodcastChat podcast={podcast} />}
          </div>
        </div>
      </>
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
