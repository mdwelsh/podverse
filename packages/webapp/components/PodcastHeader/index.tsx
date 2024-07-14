import { PodcastWithEpisodes, isReady } from 'podverse-utils';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon, RssIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';
import { EpisodeLimit } from '@/lib/limits';
import Image from 'next/image';
import { ShareButtons } from '@/components/ShareButtons';
import { auth } from '@clerk/nextjs/server';
import { buttonVariants } from '@/components/ui/button';

export async function PodcastHeader({
  podcast,
  planLimit,
  showManage = true,
}: {
  podcast: PodcastWithEpisodes;
  planLimit: EpisodeLimit | null;
  showManage?: boolean;
}) {
  const { userId } = auth();
  return (
    <div className="flex w-full flex-col gap-4 font-mono">
      <div className="flex w-full flex-row gap-4">
        <div className="flex w-[250px] flex-col gap-2">
          <div>
            {podcast.imageUrl && <Image src={podcast.imageUrl} alt="Podcast thumbnail" width={400} height={400} />}
          </div>
        </div>
        <div className="flex w-full flex-col gap-4">
          <div className="text-primary text-2xl font-bold">
            <Link href={podcast.url || `/podcast/${podcast.slug}`}>
              {podcast.title}
              <ArrowTopRightOnSquareIcon className="text-primary ml-1 inline size-4 align-super" />
            </Link>
          </div>
          <div className="font-sans text-sm">{podcast.description}</div>
        </div>
      </div>
      {showManage && userId && userId === podcast.owner && (
        <div className="flex flex-row gap-2 items-center">
          {planLimit && (
            <Link href={`/podcast/${podcast.slug}/manage`} className={buttonVariants({ variant: 'secondary' })}>
              Manage podcast
            </Link>
          )}
        </div>
      )}
      <div className="flex w-full flex-col sm:flex-row gap-4">
        <span className="text-muted-foreground text-sm">
          {podcast.Episodes.filter(isReady).length > 0 && (
            <span>{podcast.Episodes.filter(isReady).length} episodes processed / </span>
          )}
          {podcast.Episodes.length} total
        </span>
        <div className="flex flex-row gap-2">
          <PodcastLinks podcast={podcast} />
        </div>
      </div>
      {podcast.copyright && <div className="text-muted-foreground font-mono text-sm">{podcast.copyright}</div>}
      { showManage && <ShareButtons disabled={podcast.private || undefined} /> }
    </div>
  );
}

function PodcastLinks({ podcast }: { podcast: PodcastWithEpisodes }) {
  return (
    <>
      {podcast.url && (
        <div className="text-primary text-sm underline">
          <a href={podcast.url} target="_blank" rel="noreferrer">
            <GlobeAmericasIcon className="text-foreground mx-1 inline size-4" />
            Website
          </a>
        </div>
      )}
      {podcast.rssUrl && (
        <div className="text-primary text-sm underline">
          <a href={podcast.rssUrl} target="_blank" rel="noreferrer">
            <RssIcon className="text-foreground mx-1 inline size-4" />
            RSS feed
          </a>
        </div>
      )}
    </>
  );
}
