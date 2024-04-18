import { auth } from '@clerk/nextjs/server';
import { NewPodcastDialog } from '@/components/NewPodcastDialog';
import { PodcastStrip } from '@/components/PodcastStrip';
import { getPodcastStats } from '@/lib/actions';
import { PodcastStat } from 'podverse-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export async function Dashboard() {
  const { userId, protect } = auth();
  protect();
  if (!userId) {
    return null;
  }
  const podcasts: PodcastStat[] = await (await getPodcastStats()).filter((podcast) => podcast.owner === userId);

  return (
    <div className="mx-auto mt-8 flex w-3/5 flex-col gap-4">
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-row gap-2 items-center">
          <div className="font-mono text-lg">Your podcasts</div>
          <Link href="/dashboard/episodes">
            <Button variant="outline" className="text-sm font0-ono">View episodes</Button>
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
  );
}
