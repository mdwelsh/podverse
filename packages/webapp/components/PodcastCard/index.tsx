import Link from 'next/link';
import { PodcastListEntry } from 'podverse-utils';
import moment from 'moment';

export function PodcastCard({ podcast }: { podcast: PodcastListEntry }) {
  const newestEpisode = moment(podcast.newestEpisode).format('MM/DD');

  return (
    <Link className="w-full" href={`/podcast/${podcast.slug}`}>
      <div className="hover:ring-primary w-min-[400px] w-full rounded-lg border-2 border-slate-700 hover:ring-4">
        <div className="h-[70px] p-4 bg-gradient-to-b from-white from-50%  to-slate-900 to-90% text-transparent bg-clip-text text-xs md:text-sm">
          {podcast.title}
        </div>
        {podcast.imageUrl && <img src={podcast.imageUrl} alt={`${podcast.slug}`} className="w-full" />}
        <div className="hidden p-4 font-mono text-xs md:block">
          Newest episode <span className="text-primary">{newestEpisode}</span>
        </div>
      </div>
    </Link>
  );
}
