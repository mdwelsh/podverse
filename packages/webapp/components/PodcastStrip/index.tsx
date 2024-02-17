import { PodcastWithEpisodes } from 'podverse-utils';
import Link from 'next/link';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { buttonVariants } from '@/components/ui/button';

export function PodcastStrip({ podcast, manageable }: { podcast: PodcastWithEpisodes; manageable?: boolean }) {
  return (
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">{podcast.imageUrl && <img src={podcast.imageUrl} />}</div>
        <div className="line-clamp-3 flex w-4/5 flex-col gap-4 truncate text-wrap">
          <div className="text-sm">{podcast.title}</div>
          <div className="text-muted-foreground text-xs">{podcast.Episodes.length} episodes</div>
          <div className="flex flex-row gap-2">
            {manageable && (
              <>
                <ManagePodcastDialog podcast={podcast} />
                <Link className={buttonVariants({ variant: 'secondary' })} href={`/podcast/${podcast.slug}`}>
                  View
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
