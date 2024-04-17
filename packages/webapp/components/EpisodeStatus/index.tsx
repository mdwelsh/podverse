import { auth } from '@clerk/nextjs/server';
import { NewPodcastDialog } from '@/components/NewPodcastDialog';
import { Episode } from 'podverse-utils';
import { getEpisodes } from '@/lib/actions';
import moment from 'moment';
import { durationString } from '@/lib/time';
import Link from 'next/link';
import { EpisodeTooltip } from '../Indicators';

function EpisodeStrip({ episode }: { episode: Episode }) {
  return (
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">{episode.imageUrl && <img src={episode.imageUrl} />}</div>
        <div className="line-clamp-3 flex w-4/5 flex-col gap-2 truncate text-wrap">
          <div className="text-lg">{episode.title}</div>
          {episode.duration && (
            <div className="text-muted-foreground text-sm">
              Duration: <span className="text-primary">{durationString(episode.duration)}</span>
            </div>
          )}
          <div className="text-muted-foreground text-sm">
            Published <span className="text-primary">{moment(episode.pubDate).format('MMMM Do YYYY')}</span>
          </div>
          <EpisodeTooltip episode={episode} />
        </div>
      </div>
    </div>
  );
}

export async function EpisodeStatus() {
  const { userId, protect } = auth();
  protect();
  if (!userId) {
    return null;
  }
  const episodes: Episode[] = await getEpisodes({ owner: userId, offset: 0, limit: 10 });

  return (
    <div className="mx-auto mt-8 flex w-3/5 flex-col gap-4">
      <div className="flex w-full flex-row justify-between">
        <div className="text-primary font-mono text-lg">Your podcasts</div>
        <NewPodcastDialog />
      </div>
      <div className="flex size-full flex-col gap-2 overflow-y-auto p-2 text-xs">
        {episodes.length > 0 ? (
          episodes.map((episode, index) => <EpisodeStrip key={index} episode={episode} />)
        ) : (
          <div className="text-muted-foreground mt-6 font-mono text-base">
            You have not imported any podcasts yet. Visit the{' '}
            <Link href="/dashboard" className="text-primary">
              dashboard
            </Link>
            to get started.
          </div>
        )}
      </div>
    </div>
  );
}
