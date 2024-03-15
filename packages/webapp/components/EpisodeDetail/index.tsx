import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { EpisodeWithPodcast, GetEpisodeWithPodcastBySlug, GetEpisodeSuggestions } from 'podverse-utils';
import moment from 'moment';
import { EpisodeIndicator } from '../Indicators';
import { ArrowTopRightOnSquareIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Chat } from '@/components/Chat';
import { CollapseWithToggle } from '@/components/Collapse';
import { EpisodeTranscript } from '@/components/EpisodeTranscript';
import { Owner } from '@/components/Owner';
import { ManageEpisodeDialog } from '../ManageEpisodeDialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CreateMessage } from 'ai';

function EpisodeHeader({ episode }: { episode: EpisodeWithPodcast }) {
  const episodeWithoutPodcast = { ...episode, podcast: 0 };

  return (
    <div className="flex w-full flex-col gap-4 font-mono">
      <div className="text-muted-foreground">
        From{' '}
        <Link href={`/podcast/${episode.podcast.slug}`}>
          <span className="text-primary">{episode.podcast.title}</span>
        </Link>
      </div>
      <div className="flex w-full flex-row gap-4">
        <div className="w-[250px]">
          {episode.imageUrl ? (
            <img src={episode.imageUrl} />
          ) : (
            episode.podcast.imageUrl && <img src={episode.podcast.imageUrl} />
          )}
        </div>
        <div className="flex w-full flex-col gap-4">
          <div className="text-primary text-xl font-bold">
            <Link href={episode.url || `/podcast/${episode.podcast.slug}/episode/${episode.slug}`}>
              <span className="text-primary">
                {episode.title}
                {episode.url && <ArrowTopRightOnSquareIcon className="text-primary ml-1 inline size-4 align-super" />}
              </span>
            </Link>
          </div>
          <CollapseWithToggle
            extra={
              <div className="flex flex-col gap-2">
                <div className="text-muted-foreground font-mono text-sm">
                  Published {moment(episode.pubDate).format('MMMM Do YYYY')}
                </div>
                <div className="w-fit">
                  <Owner owner={episode.podcast.owner}>
                    <ManageEpisodeDialog episode={episodeWithoutPodcast}>
                      <div className={cn(buttonVariants({ variant: 'outline' }))}>
                        <div className="flex flex-row gap-2 items-center">
                          <EpisodeIndicator episode={episodeWithoutPodcast} />
                          Manage episode
                        </div>
                      </div>
                    </ManageEpisodeDialog>
                  </Owner>
                </div>
              </div>
            }
          >
            <div className="font-sans text-sm">{episode.description}</div>
          </CollapseWithToggle>
        </div>
      </div>
    </div>
  );
}

async function EpisodeSummary({ episode }: { episode: EpisodeWithPodcast }) {
  if (episode.summaryUrl === null) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div>
          <h1>Summary</h1>
        </div>
        <div className="size-full overflow-y-auto border p-4 text-xs flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">Summary not available</div>
        </div>
      </div>
    );
  }

  const res = await fetch(episode.summaryUrl);
  const result = await res.text();
  return (
    <div className="flex w-full flex-col gap-2">
      <div>
        <h1>Summary</h1>
      </div>
      <div className="w-full overflow-y-auto border p-4 font-[Inter] text-sm">{result}</div>
    </div>
  );
}

async function EpisodeChat({ episode }: { episode: EpisodeWithPodcast }) {
  const supabase = await getSupabaseClient();

  // Check if there are any Documents for this episode.
  const { data: documents, error } = await supabase.from('Documents').select('id').eq('episode', episode.id);
  if (error) {
    console.error('Error looking up documents for episode:', error);
  }
  if (!documents || documents.length === 0) {
    return (
      <div className="mt-8 flex h-[600px] w-2/5 flex-col gap-2">
        <div>
          <h1>Chat</h1>
        </div>
        <div className="size-full overflow-y-auto border p-4 text-xs">
          <div className="text-muted-foreground text-sm">Chat not available</div>
        </div>
      </div>
    );
  }

  const suggestedQueries = await GetEpisodeSuggestions(supabase, episode.id);
  // Pick 3 random ones.
  const randomSuggestions = suggestedQueries.sort(() => 0.5 - Math.random()).slice(0, 3);
  const botMessages: CreateMessage[] = [
    {
      content: `Hi there! I\'m the Podverse AI Bot. You can ask me questions about **${episode.title}** or the **${episode.podcast.title}** podcast.`,
      role: 'assistant',
    },
    {
      content: `Here are some suggestions to get you started:`,
      role: 'assistant',
    },
  ];
  const initialMessages = botMessages.concat(
    randomSuggestions.map((s) => {
      return { content: '*' + s + '*', role: 'assistant' };
    }),
  );

  return (
    <div className="mt-8 flex h-[600px] w-2/5 flex-col gap-2">
      <div>
        <h1>Chat</h1>
      </div>
      <div className="size-full overflow-y-auto border p-4 text-xs">
        {/* Assign an ID to each of the initialMessages. */}
        <Chat episodeId={episode.id} initialMessages={initialMessages.map((m, i) => ({ ...m, id: i.toString() }))} />
      </div>
    </div>
  );
}

export async function EpisodeDetail({ podcastSlug, episodeSlug }: { podcastSlug: string; episodeSlug: string }) {
  const supabase = await getSupabaseClient();
  console.log(`FETCHING: podcastSlug=${podcastSlug}, episodeSlug=${episodeSlug}`);
  const episode = await GetEpisodeWithPodcastBySlug(supabase, podcastSlug, episodeSlug);

  return (
    <div className="mx-auto mt-8 w-4/5 font-mono">
      <EpisodeHeader episode={episode} />
      <EpisodeSummary episode={episode} />
      <div className="flex flex-row gap-4">
        <EpisodeTranscript episode={episode} />
        <EpisodeChat episode={episode} />
      </div>
    </div>
  );
}
