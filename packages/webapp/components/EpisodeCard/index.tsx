import Link from 'next/link';
import { EpisodeWithPodcast } from '@/lib/storage'

/** A card showing information about a given episode. */
export function EpisodeCard({
  episode
}: {
  episode: EpisodeWithPodcast
}) {
  return (
    <Link href={`/podcasts/${episode.podcast.slug}/episodes/${episode.slug}`}>
      <div className="hover:ring-4 hover:ring-primary flex flex-col w-48 gap-4 h-full p-4 mx-4 rounded-lg border bg-gray-700 dark:bg-gray-700 text-white dark:text-white">
        <div className="flex flex-col w-full">
          <img src={episode.imageUrl} />
          <p className="mb-2 text-sm">{episode.title}</p>
        </div>
      </div>
    </Link>
  )
}