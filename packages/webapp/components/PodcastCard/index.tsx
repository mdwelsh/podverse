import Link from 'next/link';
import { PodcastListEntry } from 'podverse-utils';
import moment from 'moment';

export function PodcastCard({ podcast }: { podcast: PodcastListEntry }) {
  const newestEpisode = moment(podcast.newestEpisode).format('MM/DD');

  return (
    <Link className="w-full" href={`/podcast/${podcast.slug}`}>
      <div className="hover:ring-primary w-min-[400px] w-full rounded-md border-2 border-slate-700 hover:ring-4">
        <div className="truncate p-4 font-mono text-xs md:text-sm">{podcast.title}</div>
        {podcast.imageUrl && <img src={podcast.imageUrl} alt={`${podcast.slug}`} className="w-full" />}
        <div className="p-4 font-mono text-xs">
          Newest episode <span className="text-primary">{newestEpisode}</span>
        </div>
      </div>
    </Link>
  );
}
