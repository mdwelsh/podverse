import { Podcast, PodcastWithEpisodes } from 'podverse-utils';
import Link from 'next/link';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { buttonVariants } from '@/components/ui/button';
import { isError, isProcessing, isReady } from '@/lib/episode';
import { Icons } from '@/components/icons';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function PodcastStrip({
  podcast,
  manageable,
}: {
  podcast: Podcast | PodcastWithEpisodes;
  manageable?: boolean;
}) {
  const numEpisodes = 'Episodes' in podcast ? podcast.Episodes?.length : undefined;
  const numReadyEpisodes = 'Episodes' in podcast ? podcast.Episodes?.filter(isReady).length : undefined;
  const numProcessing = 'Episodes' in podcast ? podcast.Episodes?.filter(isProcessing).length : undefined;
  const numError = 'Episodes' in podcast ? podcast.Episodes?.filter(isError).length : undefined;

  return (
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">{podcast.imageUrl && <img src={podcast.imageUrl} />}</div>
        <div className="line-clamp-3 flex w-4/5 flex-col gap-4 truncate text-wrap">
          <div className="text-lg text-primary">{podcast.title}</div>
          {podcast.copyright && <div className="text-muted-foreground text-xs">{podcast.copyright}</div>}
          {numReadyEpisodes !== undefined ? (
            <div className="text-sm">
              <span className="text-primary">{numReadyEpisodes}</span> processed /{' '}
              <span className="text-primary">{numEpisodes}</span> episodes total
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-primary">{numEpisodes}</span> episodes
            </div>
          )}
          {numProcessing !== undefined && numProcessing > 0 && (
            <div className="text-sm flex flex-row gap-2">
              <div>
                <span className="text-primary">{numProcessing}</span> processing
              </div>
              <Icons.spinner className="text-primary size-5 animate-spin" />
            </div>
          )}
          {numError !== undefined && numError > 0 && (
            <div className="text-sm flex flex-row gap-2">
              <div>
                <span className="text-primary">{numError}</span> errors
              </div>
              <ExclamationTriangleIcon className="text-primary size-5" />
            </div>
          )}
          <div className="flex flex-row gap-2">
            {manageable && 'Episodes' in podcast && (
              <>
                <Link className={buttonVariants({ variant: 'default' })} href={`/podcast/${podcast.slug}`}>
                  View
                </Link>
                <ManagePodcastDialog podcast={podcast} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
