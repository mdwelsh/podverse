import Link from 'next/link';
import { Podcast } from 'podverse-types';

export function PodcastCard({ podcast } : { podcast : Podcast }) {
    return (
      <Link href={`/podcasts/${podcast.slug}`}>
        <div className="w-full border-2 border-slate-700 rounded-md hover:ring-4 hover:ring-primary">
          <div className="font-mono p-4 text-sm truncate">{podcast.title}</div>
          { podcast.imageUrl && <img src={podcast.imageUrl} alt={`${podcast.slug}`} className="w-full" /> }
        </div>
      </Link>
    )
  }