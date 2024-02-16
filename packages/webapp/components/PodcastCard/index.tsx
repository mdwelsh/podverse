import Link from 'next/link';
import { Podcast } from 'podverse-utils';

export function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <Link href={`/podcast/${podcast.slug}`}>
      <div className="hover:ring-primary w-full rounded-md border-2 border-slate-700 hover:ring-4">
        <div className="truncate p-4 font-mono text-sm">{podcast.title}</div>
        {podcast.imageUrl && <img src={podcast.imageUrl} alt={`${podcast.slug}`} className="w-full" />}
      </div>
    </Link>
  );
}
