import Link from 'next/link';
import { LatestEpisode } from 'podverse-utils';

/** A card showing information about a given episode. */
export function EpisodeCard({ episode }: { episode: LatestEpisode }) {
  return (
    <Link href={`/podcast/${episode.podcast.slug}/episode/${episode.slug}`}>
      <div className="mx-auto hover:ring-4 hover:ring-primary flex flex-col w-48 sm:w-40 md:w-48 gap-4 h-full p-2 md:p-4 rounded-lg border bg-gray-700 dark:bg-gray-700 text-white dark:text-white overflow-hidden">
        <div className="flex flex-col w-full h-full">
          <div className="mx-auto flex flex-col bg-black size-32 md:size-40 overflow-y-hidden">
            <div className="grow" />
            <div className="w-full">
              {episode.imageUrl ? <img src={episode.imageUrl} /> : <img src={episode.podcast.imageUrl || ''} />}
            </div>
            <div className="grow" />
          </div>
          <div className="text-wrap line-clamp-2 md:line-clamp-3 truncate">
            <p className="font-[Inter] mb-2 mt-2 text-sm md:text-sm">{episode.title}</p>
          </div>
          <div className="grow" />
          <div className="h-4">
            {episode.podcast.title && (
              <p className="text-xs truncate mt-0 md:mt-2">
                from <span className="text-primary">{episode.podcast.title}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
