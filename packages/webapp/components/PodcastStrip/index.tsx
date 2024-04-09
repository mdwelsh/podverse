import { Podcast, PodcastWithEpisodes, PodcastWithEpisodesMetadata } from 'podverse-utils';
import Link from 'next/link';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { buttonVariants } from '@/components/ui/button';
import { isError, isProcessing, isReady } from '@/lib/episode';
import { Icons } from '@/components/icons';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PodcastStat } from '@/lib/plans';

export function PodcastStrip({
  podcast,
  manageable,
}: {
  podcast: PodcastStat | Podcast | PodcastWithEpisodes;
  manageable?: boolean;
}) {
  const numEpisodes =
    'Episodes' in podcast ? podcast.Episodes?.length : 'allepisodes' in podcast ? podcast.allepisodes : 0;
  const numReadyEpisodes =
    'Episodes' in podcast ? podcast.Episodes?.filter(isReady).length : 'processed' in podcast ? podcast.processed : 0;
  const numProcessing =
    'Episodes' in podcast
      ? podcast.Episodes?.filter(isProcessing).length
      : 'inprogress' in podcast
        ? podcast.inprogress
        : 0;
  const numError =
    'Episodes' in podcast ? podcast.Episodes?.filter(isError).length : 'errors' in podcast ? podcast.errors : 0;

  return (
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">{podcast.imageUrl && <img src={podcast.imageUrl} />}</div>
        <div className="line-clamp-3 flex w-4/5 flex-col gap-4 truncate text-wrap">
          <div className="text-primary text-lg">{podcast.title}</div>
          {/* {podcast.copyright && <div className="text-muted-foreground text-xs">{podcast.copyright}</div>} */}
          {numReadyEpisodes > 0 ? (
            <div className="text-sm">
              <span className="text-primary">{numReadyEpisodes}</span> processed /{' '}
              <span className="text-primary">{numEpisodes}</span> episodes total
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-primary">{numEpisodes}</span> episodes
            </div>
          )}
          {numProcessing > 0 && (
            <div className="flex flex-row gap-2 text-sm">
              <div>
                <span className="text-primary">{numProcessing}</span> processing
              </div>
              <Icons.spinner className="text-primary size-5 animate-spin" />
            </div>
          )}
          {numError > 0 && (
            <div className="flex flex-row gap-2 text-sm">
              <div>
                <span className="text-primary">{numError}</span> errors
              </div>
              <ExclamationTriangleIcon className="text-primary size-5" />
            </div>
          )}
          <div className="flex flex-row gap-2">
            <Link className={buttonVariants({ variant: 'default' })} href={`/podcast/${podcast.slug}`}>
              View
            </Link>
            <ManagePodcastDialog podcastSlug={podcast.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
