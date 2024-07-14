import Link from 'next/link';
import { LatestEpisode } from 'podverse-utils';
import Image from 'next/image';

/** A card showing information about a given episode. */
export function EpisodeCard({ episode }: { episode: LatestEpisode }) {
  return (
    <Link target="_parent" href={`/podcast/${episode.podcast.slug}/episode/${episode.slug}`}>
      <div className="hover:ring-primary mx-auto flex h-full w-40 flex-col gap-4 overflow-hidden rounded-lg border bg-gray-700 p-2 text-white hover:ring-4 sm:w-40 md:w-48 md:p-4 dark:bg-gray-700 dark:text-white">
        <div className="flex size-full flex-col">
          <div className="mx-auto flex size-32 flex-col overflow-y-hidden bg-black md:size-40">
            <div className="grow" />
            <div className="w-full">
              {episode.imageUrl ? (
                <Image alt="Episode thumbnail" src={episode.imageUrl} width={160} height={160} />
              ) : (
                <Image alt="Episode thumbnail" src={episode.podcast.imageUrl || ''} width={160} height={160} />
              )}
            </div>
            <div className="grow" />
          </div>
          <div className="line-clamp-2 truncate text-wrap md:line-clamp-3">
            <p className="my-2 font-[Inter] text-sm md:text-sm">{episode.title}</p>
          </div>
          <div className="grow" />
          <div className="h-4">
            {episode.podcast.title && (
              <p className="mt-0 truncate text-xs md:mt-2">
                from <span className="text-primary">{episode.podcast.title}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
