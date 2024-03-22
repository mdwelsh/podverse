import Link from 'next/link';
import { LatestEpisode } from 'podverse-utils';

/** A card showing information about a given episode. */
export function EpisodeCard({ episode }: { episode: LatestEpisode }) {
  return (
    <Link href={`/podcast/${episode.podcast.slug}/episode/${episode.slug}`}>
      <div className="hover:ring-4 hover:ring-primary flex flex-col w-40 md:w-48 gap-4 h-full p-4 mx-4 rounded-lg border bg-gray-700 dark:bg-gray-700 text-white dark:text-white overflow-hidden">
        <div className="flex flex-col w-full h-full">
          <div className="flex flex-col bg-black w-40 h-40 overflow-y-hidden">
            <div className="grow" />
            <div>
              {episode.imageUrl ? <img src={episode.imageUrl} /> : <img src={episode.podcast.imageUrl || ''} />}
            </div>
            <div className="grow" />
          </div>
          <div className="text-wrap line-clamp-3 truncate">
            <p className="font-[Inter] mb-2 mt-2 text-xs md:text-sm">{episode.title}</p>
          </div>
          <div className="grow" />
          <div className="h-4">
            {episode.podcast.title && (
              <p className="text-xs truncate">
                from <span className="text-primary">{episode.podcast.title}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
