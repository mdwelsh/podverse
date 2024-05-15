import { auth } from '@clerk/nextjs/server';
import { NewPodcastDialog } from '@/components/NewPodcastDialog';
import { PodcastStrip } from '@/components/PodcastStrip';
import { getPodcastStats } from '@/lib/actions';
import { PodcastStat } from 'podverse-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function NewPodcastHeader({ podcast }: { podcast: PodcastStat }) {
  return (
    <div className="flex flex-row bg-sky-900 p-2 text-center text-white">
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-3">
          <div className="text-sm">You are now the owner of the podcast:</div>
          <div className="font-mono text-primary underline underline-offset-4">
            <Link href={`/podcasts/${podcast.slug}`}>{podcast.title}</Link>
          </div>
          <div className="text-sm">
            Click the <b>Manage podcast</b> button below to manage it.
          </div>
        </div>
      </div>
    </div>
  );
}

export async function Dashboard({ assignedPodcast }: { assignedPodcast?: string }) {
  const { userId, protect } = auth();
  protect();
  if (!userId) {
    return null;
  }
  const podcasts: PodcastStat[] = await (await getPodcastStats()).filter((podcast) => podcast.owner === userId);

  let newPodcast = null;
  if (assignedPodcast) {
    newPodcast = podcasts.find((podcast) => podcast.slug === assignedPodcast);
  }

  return (
    <>
      {newPodcast && <NewPodcastHeader podcast={newPodcast} />}
      <div className="mx-auto mt-8 flex w-full px-2 md:w-3/5 flex-col gap-4">
        <div className="flex w-full flex-row justify-between">
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="font-mono text-lg">Your podcasts</div>
            <Link href="/dashboard/episodes">
              <Button variant="outline" className="text-sm">
                View episodes
              </Button>
            </Link>
          </div>
          <NewPodcastDialog />
        </div>
        <div className="flex size-full flex-col gap-2 overflow-y-auto p-2 text-xs">
          {podcasts.length > 0 ? (
            podcasts.map((podcast, index) => <PodcastStrip key={index} slug={podcast.slug} />)
          ) : (
            <div className="text-muted-foreground mt-6 font-mono text-base">
              You have not imported any podcasts yet. Click the <span className="text-primary">New podcast</span> button
              above to get started.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
