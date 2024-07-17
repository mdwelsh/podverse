import Link from 'next/link';
import { EpisodeWithPodcast } from 'podverse-utils';
import moment from 'moment';
import { EpisodeIndicator } from '../Indicators';
import { ArrowTopRightOnSquareIcon, RssIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';
import { CollapseWithToggle } from '@/components/Collapse';
import { Owner } from '@/components/Owner';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ShareButtons } from '@/components/ShareButtons';

export function EpisodeHeader({
  episode,
  uuid,
  showManage,
}: {
  episode: EpisodeWithPodcast;
  uuid?: string;
  showManage?: boolean;
}) {
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
        {showManage && (
          <Owner owner={episode.podcast.owner}>
            <div className="flex flex-row gap-2 items-center">
              <Link href={`/podcast/${episode.podcast.slug}/episode/${episode.slug}/manage`}>
                <div className={cn(buttonVariants({ variant: 'outline' }))}>
                  <div className="flex flex-row items-center gap-2">
                    <EpisodeIndicator episode={episodeWithoutPodcast} />
                    Manage episode
                  </div>
                </div>
              </Link>
            </div>
          </Owner>
        )}
        <div className="flex flex-row gap-1 sm:flex-row sm:items-center">
          <div className="text-muted-foreground font-mono text-sm">
            Published <span className="text-primary">{moment(episode.pubDate).format('MMMM Do YYYY')}</span>
          </div>
          <EpisodeLinks episode={episode} />
        </div>
        {episode.podcast.copyright && (
          <div className="text-muted-foreground font-mono text-sm">{episode.podcast.copyright}</div>
        )}
        {showManage && (
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <ShareButtons disabled={episode.podcast.private || false} />
          </div>
        )}
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
