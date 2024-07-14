import { getSupabaseClient } from '@/lib/supabase';
import { PodcastWithEpisodes, GetPodcastWithEpisodes, isReady } from 'podverse-utils';
import { PodcastEpisodeList } from '@/components/PodcastEpisodeList';
import Link from 'next/link';
import { PodcastLinkHeader } from '@/components/PodcastLinkHeader';
import { ContextAwareChat } from '@/components/Chat';
import { getEpisodeLimit } from '@/lib/actions';
import { ChatContextProvider } from '../ChatContext';
import { PodcastHeader } from '@/components/PodcastHeader';


export function PodcastChat({ podcast }: { podcast: PodcastWithEpisodes }) {
  if (!podcast.suggestions || podcast.suggestions.length === 0) {
    return (
      <div className="mt-8 flex h-[1000px] w-2/5 flex-col gap-2">
        <div>
          <h1>Chat</h1>
        </div>
        <div className="size-full overflow-y-auto border p-4 font-mono text-sm">Chat not available</div>
      </div>
    );
  }

  return (
    <div className="mt-8 hidden h-[1000px] w-2/5 flex-col gap-2 lg:flex">
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

export async function PodcastDetail({
  podcastSlug,
  uuid,
  activationCode,
  header = true,
  embed = false,
  entriesPerPage = 10,
}: {
  podcastSlug: string;
  uuid?: string;
  activationCode?: string;
  header?: boolean;
  embed?: boolean;
  entriesPerPage?: number;
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
        {!embed && <PodcastLinkHeader podcast={podcast} activationCode={activationCode} />}
        <div className="mx-auto mt-8 w-full px-2 md:w-4/5">
          {(!embed || header) && <PodcastHeader podcast={podcast} planLimit={planLimit} />}
          <div className="flex flex-col gap-4 sm:flex-row">
            <PodcastEpisodeList
              podcast={podcast}
              episodes={podcast.Episodes}
              embed={embed}
              entriesPerPage={entriesPerPage}
            />
            {!embed && podcast.Episodes.filter(isReady).length > 0 && <PodcastChat podcast={podcast} />}
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error looking up podcast:', error);
    return (
      <div className="mx-auto mt-8 flex w-full flex-col gap-4 px-2 font-mono md:w-4/5">
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
