import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { PodcastStat, isError, isProcessing, isReady } from 'podverse-utils';
import { Icons } from '@/components/icons';
import { ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { getEpisodeLimit } from '@/lib/actions';
import Image from 'next/image';

export async function PodcastStrip({ podcast }: { podcast: PodcastStat }) {
  const podcastUuid = podcast.uuid?.replace(/-/g, '');
  const podcastLink = `${podcast.slug}?uuid=${podcastUuid}`;
  const planLimit = await getEpisodeLimit(podcast.id);
  if (!planLimit) {
    throw new Error('Plan limit not found');
  }
  const numEpisodes = podcast.allepisodes;
  const numReadyEpisodes = podcast.processed;
  const numProcessing = podcast.inprogress;
  const numError = podcast.errors;

  return (
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">
          {podcast.imageUrl && <Image src={podcast.imageUrl} alt="Podcast thumbnail" width={100} height={100} />}
        </div>
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
          <div className="flex flex-row gap-2 text-sm">
            <div>
              Auto-processing is <span className="text-primary">{podcast.process ? 'enabled' : 'disabled'}</span>
            </div>
          </div>

          {podcast.private ? (
            <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
              <EyeSlashIcon className="size-5" />
              Private
            </div>
          ) : (
            <div className="text-sm text-primary flex flex-row gap-2 items-center">
              <EyeIcon className="size-5" />
              Public
            </div>
          )}
          <div className="flex flex-row gap-2">
            <Link className={buttonVariants({ variant: 'default' })} href={`/podcast/${podcastLink}`}>
              View
            </Link>
            <Link
              className={buttonVariants({ variant: 'secondary' })}
              href={`/podcast/${podcast.slug}/manage?uuid=${podcastUuid}`}
            >
              Manage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
