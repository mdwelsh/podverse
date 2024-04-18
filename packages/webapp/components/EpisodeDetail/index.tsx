import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { EpisodeWithPodcast, GetEpisodeWithPodcastBySlug, isReady } from 'podverse-utils';
import moment from 'moment';
import { EpisodeIndicator } from '../Indicators';
import { ArrowTopRightOnSquareIcon, RssIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';
import { CollapseWithToggle } from '@/components/Collapse';
import { Owner } from '@/components/Owner';
import { ManageEpisodeDialog } from '../ManageEpisodeDialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EpisodeClient } from '@/components/EpisodeClient';

function EpisodeHeader({ episode }: { episode: EpisodeWithPodcast }) {
  const episodeWithoutPodcast = { ...episode, podcast: episode.podcast.id };

  return (
    <div className="mb-4 grid w-full grid-cols-4 gap-4 font-mono">
      <div className="text-muted-foreground col-span-4">
        From{' '}
        <Link href={`/podcast/${episode.podcast.slug}`}>
          <span className="text-primary">{episode.podcast.title}</span>
        </Link>
      </div>
      <div className="block md:block">
        {episode.imageUrl ? (
          <img src={episode.imageUrl} />
        ) : (
          episode.podcast.imageUrl && <img src={episode.podcast.imageUrl} />
        )}
      </div>
      <div className="col-span-3">
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
              <div className="flex flex-col gap-2 lg:flex-row">
                <div className="text-muted-foreground font-mono text-sm">
                  Published <span className="text-primary">{moment(episode.pubDate).format('MMMM Do YYYY')}</span>
                </div>
                <EpisodeLinks episode={episode} />
              </div>
              {episode.podcast.copyright && (
                <div className="text-muted-foreground font-mono text-sm">{episode.podcast.copyright}</div>
              )}
              <div className="w-fit">
                <Owner owner={episode.podcast.owner}>
                  <ManageEpisodeDialog episode={episodeWithoutPodcast}>
                    <div className={cn(buttonVariants({ variant: 'outline' }))}>
                      <div className="flex flex-row items-center gap-2">
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
  );
}

function EpisodeLinks({ episode }: { episode: EpisodeWithPodcast }) {
  return (
    <div className="flex flex-row gap-2">
      {episode.url && (
        <div className="text-primary text-sm underline">
          <a href={episode.url} target="_blank" rel="noreferrer">
            <GlobeAmericasIcon className="text-foreground mx-1 inline size-4" />
            Website
          </a>
        </div>
      )}
      {episode.podcast.rssUrl && (
        <div className="text-primary text-sm underline">
          <a href={episode.podcast.rssUrl} target="_blank" rel="noreferrer">
            <RssIcon className="text-foreground mx-1 inline size-4" />
            RSS feed
          </a>
        </div>
      )}
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
        <div className="flex size-full flex-col gap-2 overflow-y-auto border p-4 text-xs">
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

export async function EpisodeDetail({ podcastSlug, episodeSlug }: { podcastSlug: string; episodeSlug: string }) {
  const supabase = await getSupabaseClient();
  const episode = await GetEpisodeWithPodcastBySlug(supabase, podcastSlug, episodeSlug);

  // Check if there are any Documents for this episode.
  const { data: documents, error } = await supabase.from('Documents').select('id').eq('episode', episode.id);
  if (error) {
    console.error('Error looking up documents for episode:', error);
  }
  const chatAvailable = (documents && documents.length > 0) || false;

  return (
    <div className="mx-auto mt-8 w-11/12 font-mono md:w-4/5">
      <EpisodeHeader episode={episode} />
      {isReady(episode) ? (
        <>
          <EpisodeSummary episode={episode} />
          <EpisodeClient episode={episode} chatAvailable={chatAvailable} />
        </>
      ) : (
        <div className="mt-8">This episode has not yet been processed.</div>
      )}
    </div>
  );
}
