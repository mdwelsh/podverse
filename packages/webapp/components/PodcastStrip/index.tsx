import Link from 'next/link';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { buttonVariants } from '@/components/ui/button';
import { isError, isProcessing, isReady } from 'podverse-utils';
import { Icons } from '@/components/icons';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getPodcastWithEpisodes, getEpisodeLimit } from '@/lib/actions';
import Image from 'next/image';

export async function PodcastStrip({
  slug,
}: {
  slug: string;
}) {
  const podcast = await getPodcastWithEpisodes(slug);
  const podcastUuid = podcast.uuid?.replace(/-/g, '');
  const podcastLink = `${slug}-${podcastUuid}`;
  const planLimit = await getEpisodeLimit(podcast.id);
  if (!planLimit) {
    throw new Error('Plan limit not found');
  }
  const numEpisodes = podcast.Episodes?.length;
  const numReadyEpisodes = podcast.Episodes?.filter(isReady).length;
  const numProcessing = podcast.Episodes?.filter(isProcessing).length;
  const numError = podcast.Episodes?.filter(isError).length;

  return (
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">{podcast.imageUrl && <Image src={podcast.imageUrl} alt="Podcast thumbnail" width={100} height={100} />}</div>
        <div className="line-clamp-3 flex w-4/5 flex-col gap-4 truncate text-wrap">
          <div className="text-primary line-clamp-2 text-lg">{podcast.title}</div>
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
            <Link className={buttonVariants({ variant: 'default' })} href={`/podcast/${podcastLink}`}>
              View
            </Link>
            <ManagePodcastDialog podcast={podcast} planLimit={planLimit} />
          </div>
        </div>
      </div>
    </div>
  );
}
