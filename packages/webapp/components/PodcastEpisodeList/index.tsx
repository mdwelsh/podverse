'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Episode, PodcastWithEpisodes, isReady } from 'podverse-utils';
import moment from 'moment';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { EpisodeTooltip } from '../Indicators';
import { useAuth } from '@clerk/nextjs';
import { durationString } from '@/lib/time';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { PoweredBy } from '../PoweredBy';

export function ShowAllSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="publish-episode" checked={checked} onCheckedChange={onCheckedChange} />
      <Label className="text-muted-foreground font-mono text-sm" htmlFor="publish-episode">
        Include unprocessed
      </Label>
    </div>
  );
}

export function PodcastEpisodeList({
  podcast,
  episodes,
  entriesPerPage = 10,
  embed = false,
}: {
  podcast: PodcastWithEpisodes;
  episodes: Episode[];
  entriesPerPage?: number;
  embed?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(embed || episodes.filter(isReady).length === 0);
  const searchParams = useSearchParams();
  const maybeSearchParams = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const showEpisodes = showAll ? episodes : episodes.filter(isReady);
  const numPages = Math.ceil(showEpisodes.length / entriesPerPage);

  const onPrevious = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  const onNext = () => {
    if (page < numPages) {
      setPage(page + 1);
    }
  };
  const gotoPage = (value: number) => {
    setPage(value);
  };

  const episodesToShow = showEpisodes.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  return (
    <div className={`${embed ? 'mt-0' : 'mt-8'} flex w-full flex-col gap-2 lg:w-3/5`}>
      <div className="flex w-full flex-row items-center gap-2">
        {!embed && <div className="mr-4">Episodes</div>}
        {!embed && <ShowAllSwitch checked={showAll} onCheckedChange={setShowAll} />}
        {embed && (
          <div className="ml-4">
            <PoweredBy />
          </div>
        )}
        <div className="grow" />
        <div className={`w-fit ${embed ? 'self-start' : 'self-end'}`}>
          <Pagination>
            <PaginationContent className="gap-0 text-xs">
              <PaginationItem>
                <PaginationPrevious isActive onClick={onPrevious} />
              </PaginationItem>
              {page > 1 && (
                <PaginationItem>
                  <PaginationLink key={1} onClick={() => gotoPage(1)}>
                    1
                  </PaginationLink>
                </PaginationItem>
              )}
              {page > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink key={page} className="text-primary" onClick={() => gotoPage(page)}>
                  {page}
                </PaginationLink>
              </PaginationItem>
              {page < numPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              {page < numPages && (
                <PaginationItem>
                  <PaginationLink key={numPages} onClick={() => gotoPage(numPages)}>
                    {numPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext isActive onClick={onNext} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      <div className="flex size-full flex-col gap-2 overflow-y-auto p-2 text-xs">
        {episodesToShow.map((episode, index) => (
          <Link
            target="_parent"
            key={index}
            href={`/podcast/${podcast.slug}/episode/${episode.slug}${maybeSearchParams}`}
            className="hover:ring-primary hover:ring-4"
          >
            <EpisodeStrip key={index} podcast={podcast} episode={episode} showIndicator={showAll && embed === false} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function EpisodeStrip({
  podcast,
  episode,
  showIndicator,
}: {
  podcast: PodcastWithEpisodes;
  episode: Episode;
  showIndicator?: boolean;
}) {
  const { userId } = useAuth();

  return (
    <div className="bg-muted text-foreground flex w-full flex-row gap-4 overflow-hidden rounded-lg border p-4 font-mono">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">
          {episode.imageUrl ? (
            <Image src={episode.imageUrl} alt="Episode thumbnail" width={100} height={100} />
          ) : (
            <Image src={podcast.imageUrl || ''} alt="Episode thumbnail" width={100} height={100} />
          )}
        </div>
        <div className="line-clamp-3 flex w-4/5 flex-col gap-2 truncate text-wrap">
          <div className="text-lg">{episode.title}</div>
          {episode.duration && (
            <div className="text-muted-foreground text-sm">
              Duration: <span className="text-primary">{durationString(episode.duration)}</span>
            </div>
          )}
          <div className="text-muted-foreground text-sm">
            Published <span className="text-primary">{moment(episode.pubDate).format('MMMM Do YYYY')}</span>
          </div>
          {showIndicator && <EpisodeTooltip episode={episode} />}
        </div>
      </div>
    </div>
  );
}
