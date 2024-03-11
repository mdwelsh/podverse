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

export function PodcastEpisodeList({ podcast, episodes }: { podcast: PodcastWithEpisodes; episodes: Episode[] }) {
  const [page, setPage] = useState(1);

  const ENTRIES_PER_PAGE = 10;
  const numPages = Math.ceil(episodes.length / ENTRIES_PER_PAGE);

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
  const episodesToShow = episodes.slice((page - 1) * ENTRIES_PER_PAGE, page * ENTRIES_PER_PAGE);

  return (
    <div className="mt-8 flex h-[800px] w-3/5 flex-col gap-2">
      <div className="flex w-full flex-row items-center gap-2">
        <div>Episodes</div>
        <div className="grow" />
        <div>
          <Pagination>
            <PaginationContent className="gap-0 text-xs">
              <PaginationItem>
                <PaginationPrevious isActive onClick={onPrevious} />
              </PaginationItem>
              {page > 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => gotoPage(1)}>1</PaginationLink>
                </PaginationItem>
              )}
              {page > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink className="text-primary" onClick={() => gotoPage(page)}>
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
                  <PaginationLink onClick={() => gotoPage(numPages)}>{numPages}</PaginationLink>
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
          <Link href={`/podcast/${podcast.slug}/episode/${episode.slug}`} className="hover:ring-primary hover:ring-4">
            <EpisodeStrip key={index} podcast={podcast} episode={episode} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function EpisodeStrip({ podcast, episode }: { podcast: PodcastWithEpisodes; episode: Episode }) {
  const { userId } = useAuth();

  return (
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">{episode.imageUrl && <img src={episode.imageUrl} />}</div>
        <div className="line-clamp-3 flex w-4/5 flex-col gap-4 truncate text-wrap">
          <div className="text-sm">{episode.title}</div>
          <div className="text-muted-foreground text-xs">
            Published {moment(episode.pubDate).format('MMMM Do YYYY')}
          </div>
          {userId && userId === podcast.owner && <EpisodeTooltip episode={episode} />}
        </div>
      </div>
    </div>
  );
}
