'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Episode, PodcastWithEpisodes } from 'podverse-utils';
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
import { isReady } from '@/lib/episode';
import { durationString } from '@/lib/time';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
      <Label className="font-mono text-sm text-muted-foreground" htmlFor="publish-episode">
        Include unprocessed
      </Label>
    </div>
  );
}

export function PodcastEpisodeList({ podcast, episodes }: { podcast: PodcastWithEpisodes; episodes: Episode[] }) {
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(episodes.filter(isReady).length === 0);

  const ENTRIES_PER_PAGE = 10;

  const showEpisodes = showAll ? episodes : episodes.filter(isReady);
  const numPages = Math.ceil(showEpisodes.length / ENTRIES_PER_PAGE);

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

  const episodesToShow = showEpisodes.slice((page - 1) * ENTRIES_PER_PAGE, page * ENTRIES_PER_PAGE);

  return (
    <div className="mt-8 flex h-[800px] w-full lg:w-3/5 flex-col gap-2">
      <div className="flex w-full flex-row items-center gap-2">
        <div className="mr-4">Episodes</div>
        <ShowAllSwitch checked={showAll} onCheckedChange={setShowAll} />
        <div className="grow" />
        <div>
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
            key={index}
            href={`/podcast/${podcast.slug}/episode/${episode.slug}`}
            className="hover:ring-primary hover:ring-4"
          >
            <EpisodeStrip key={index} podcast={podcast} episode={episode} showIndicator={showAll} />
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
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">
          {episode.imageUrl ? <img src={episode.imageUrl} /> : <img src={podcast.imageUrl || ''} />}
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
          {(showIndicator || (userId && userId === podcast.owner)) && <EpisodeTooltip episode={episode} />}
        </div>
      </div>
    </div>
  );
}
