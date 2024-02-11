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
    <div className="w-3/5 mt-8 h-[600px] flex flex-col gap-2">
      <div className="w-full flex flex-row gap-2 items-center">
        <div>Episodes</div>
        <div className="flex-grow" />
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
      <div className="w-full flex flex-col p-2 gap-2 text-xs overflow-y-auto h-full">
        {episodesToShow.map((episode, index) => (
          <EpisodeStrip key={index} podcast={podcast} episode={episode} />
        ))}
      </div>
    </div>
  );
}

function EpisodeStrip({ podcast, episode }: { podcast: PodcastWithEpisodes; episode: Episode }) {
  return (
    <Link href={`/podcast/${podcast.slug}/episode/${episode.slug}`}>
      <div className="hover:ring-4 hover:ring-primary flex flex-row gap-4 w-full rounded-lg p-4 border bg-gray-700 dark:bg-gray-700 text-white dark:text-white overflow-hidden">
        <div className="flex flex-row w-full h-full gap-4">
          <div className="w-1/5">{episode.imageUrl && <img src={episode.imageUrl} />}</div>
          <div className="w-4/5 text-wrap line-clamp-3 truncate flex flex-col gap-4">
            <div className="text-sm">{episode.title}</div>
            <div className="text-xs text-muted-foreground">
              Published {moment(episode.pubDate).format('MMMM Do YYYY')}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
