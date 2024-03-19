import supabase from '@/lib/supabase';
import { PodcastWithEpisodes, GetPodcastWithEpisodes, GetUser, GetPodcastSuggestions } from 'podverse-utils';
import { PodcastEpisodeList } from '@/components/PodcastEpisodeList';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon, RssIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';
import { Owner } from '@/components/Owner';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { Chat } from '@/components/Chat';
import { getSupabaseClient } from '@/lib/supabase';
import { CreateMessage } from 'ai';

async function PodcastHeader({ podcast }: { podcast: PodcastWithEpisodes }) {
  const user = podcast.owner ? await GetUser(supabase, podcast.owner) : null;

  return (
    <div className="flex w-full flex-col gap-4 font-mono">
      <div className="flex w-full flex-row gap-4">
        <div className="w-[250px]">{podcast.imageUrl && <img src={podcast.imageUrl} />}</div>
        <div className="flex w-full flex-col gap-4">
          <div className="text-primary text-xl font-bold">
            <Link href={podcast.url || `/podcast/${podcast.slug}`}>
              {podcast.title}
              <ArrowTopRightOnSquareIcon className="text-primary ml-1 inline size-4 align-super" />
            </Link>
          </div>
          <div className="font-sans text-sm">{podcast.description}</div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <div className="text-muted-foreground flex flex-row gap-4 font-mono text-sm">
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
    <div className="flex flex-row gap-2">
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
    </div>
  );
}

async function PodcastChat({ podcast }: { podcast: PodcastWithEpisodes }) {
  const supabase = await getSupabaseClient();
  const suggestedQueries = await GetPodcastSuggestions(supabase, podcast.id);
  if (!suggestedQueries || suggestedQueries.length === 0) {
    return (
      <div className="mt-8 flex h-[800px] w-2/5 flex-col gap-2">
        <div>
          <h1>Chat</h1>
        </div>
        <div className="size-full overflow-y-auto border p-4 font-mono text-sm">Chat not available</div>
      </div>
    );
  }

  const randomSuggestions = suggestedQueries.sort(() => 0.5 - Math.random()).slice(0, 3);
  const initialMessages: CreateMessage[] = [
    {
      content: `Hi there! I\'m the Podverse AI Bot. You can ask me questions about the **${podcast.title}** podcast.`,
      role: 'assistant',
    },
    {
      content: 'Here are some suggestions to get you started:\n' + randomSuggestions.map((s) => `[${s}](/?suggest)`).join(' '),
      role: 'assistant',
    },
  ];
  console.log('initialMessages:', initialMessages);

  return (
    <div className="mt-8 flex h-[800px] w-2/5 flex-col gap-2">
      <div>
        <h1>Chat</h1>
      </div>
      <div className="size-full overflow-y-auto border p-4 text-xs">
        {/* Assign an ID to each of the initialMessages. */}
        <Chat podcastId={podcast.id} initialMessages={initialMessages.map((m, i) => ({ ...m, id: i.toString() }))} />
      </div>
    </div>
  );
}

export async function PodcastDetail({ podcastSlug }: { podcastSlug: string }) {
  try {
    const podcast = await GetPodcastWithEpisodes(supabase, podcastSlug);
    return (
      <div className="mx-auto mt-8 w-4/5">
        <PodcastHeader podcast={podcast} />
        <div className="flex flex-row gap-4">
          <PodcastEpisodeList podcast={podcast} episodes={podcast.Episodes} />
          <PodcastChat podcast={podcast} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error looking up podcast:', error);
    return (
      <div className="mx-auto mt-8 w-4/5 font-mono flex flex-col gap-4">
        <div>
          Failed to load podcast <span className="text-primary">{podcastSlug}</span>
        </div>
        <div>
          <Link className="font-mono text-primary underline" href="/">
            Go home
          </Link>
        </div>
      </div>
    );
  }
}
