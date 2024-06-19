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
import Image from 'next/image';
import { ShareButtons } from '@/components/ShareButtons';
import { PodcastLinkHeader } from '@/components/PodcastLinkHeader';
import { EmbedPodcastDialog } from '@/components/EmbedPodcastDialog';

function EpisodeHeader({ episode, uuid }: { episode: EpisodeWithPodcast; uuid?: string }) {
  const episodeWithoutPodcast = { ...episode, podcast: episode.podcast.id };
  const maybeUuid = uuid ? `?uuid=${uuid}` : '';

  return (
    <div className="mb-4 flex w-full flex-col gap-2 font-mono">
      <div className="text-muted-foreground col-span-4">
        From{' '}
        <Link href={`/podcast/${episode.podcast.slug}${maybeUuid}`}>
          <span className="text-primary">{episode.podcast.title}</span>
        </Link>
      </div>
      <div className="flex flex-row gap-2 sm:gap-4 mb-2">
        <div className="mt-2 w-full max-w-32 sm:max-w-64 flex flex-col gap-1">
          {episode.imageUrl ? (
            <Image src={episode.imageUrl} width={400} height={400} alt="Episode thumbnail image" />
          ) : (
            episode.podcast.imageUrl && (
              <Image src={episode.podcast.imageUrl} width={400} height={400} alt="Episode thumbnail image" />
            )
          )}
        </div>
        <div className="w-full">
          <div className="text-primary text-xl font-bold">
            <Link href={episode.url || `/podcast/${episode.podcast.slug}/episode/${episode.slug}`}>
              <span className="text-primary">
                {episode.title}
                {episode.url && <ArrowTopRightOnSquareIcon className="text-primary ml-1 inline size-4 align-super" />}
              </span>
            </Link>
          </div>
          <CollapseWithToggle>
            <div className="font-sans text-sm">{episode.description}</div>
          </CollapseWithToggle>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Owner owner={episode.podcast.owner}>
          <div className="flex flex-row gap-2 items-center">
            <ManageEpisodeDialog episode={episodeWithoutPodcast}>
              <div className={cn(buttonVariants({ variant: 'outline' }))}>
                <div className="flex flex-row items-center gap-2">
                  <EpisodeIndicator episode={episodeWithoutPodcast} />
                  Manage episode
                </div>
              </div>
            </ManageEpisodeDialog>
            <EmbedPodcastDialog podcastSlug={episode.podcast.slug} episodeSlug={episode.slug} />
          </div>
        </Owner>
        <div className="flex flex-row gap-1 sm:flex-row sm:items-center">
          <div className="text-muted-foreground font-mono text-sm">
            Published <span className="text-primary">{moment(episode.pubDate).format('MMMM Do YYYY')}</span>
          </div>
          <EpisodeLinks episode={episode} />
        </div>
        {episode.podcast.copyright && (
          <div className="text-muted-foreground font-mono text-sm">{episode.podcast.copyright}</div>
        )}
        <div className="flex flex-col justify-between gap-2 sm:flex-row">
          <ShareButtons disabled={episode.podcast.private || false} />
        </div>
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

export async function EpisodeDetail({
  podcastSlug,
  episodeSlug,
  uuid,
  activationCode,
}: {
  podcastSlug: string;
  episodeSlug: string;
  uuid?: string;
  activationCode?: string;
}) {
  const supabase = await getSupabaseClient();
  const episode = await GetEpisodeWithPodcastBySlug(supabase, podcastSlug, episodeSlug);
  try {
    if (episode.podcast.private && episode.podcast.uuid) {
      if (uuid) {
        if (uuid !== episode.podcast.uuid.replace(/-/g, '')) {
          throw new Error('Podcast is private and UUID does not match');
        }
      } else if (activationCode) {
        if (activationCode !== episode.podcast.uuid.replace(/-/g, '')) {
          throw new Error('Podcast is private and activation code does not match');
        }
      } else {
        throw new Error('Podcast is private and no UUID or activation code provided');
      }
    }
  } catch (error) {
    console.error('Error checking private podcast:', error);
    return <div className="mx-auto mt-8 w-11/12 font-mono md:w-4/5">This podcast is private.</div>;
  }

  // Check if there are any Documents for this episode.
  const { data: documents, error } = await supabase.from('Documents').select('id').eq('episode', episode.id);
  if (error) {
    console.error('Error looking up documents for episode:', error);
  }
  const chatAvailable = (documents && documents.length > 0) || false;

  return (
    <>
      <PodcastLinkHeader podcast={episode.podcast} activationCode={activationCode} />
      <div className="mx-auto mt-8 w-full px-2 font-mono md:w-4/5">
        <EpisodeHeader episode={episode} uuid={uuid} />
        {isReady(episode) ? (
          <>
            <EpisodeSummary episode={episode} />
            <EpisodeClient episode={episode} chatAvailable={chatAvailable} />
          </>
        ) : (
          <div className="mt-8">This episode has not yet been processed.</div>
        )}
      </div>
    </>
  );
}
