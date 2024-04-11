import { auth } from '@clerk/nextjs/server';
import { NewPodcastDialog } from '@/components/NewPodcastDialog';
import { PodcastStrip } from '@/components/PodcastStrip';
import { getPodcastStats } from '@/lib/actions';
import { PodcastStat } from 'podverse-utils';

export async function Dashboard() {
  const { userId, protect } = auth();
  protect();
  if (!userId) {
    return null;
  }
  const podcasts: PodcastStat[] = await getPodcastStats();

  return (
    <div className="mx-auto mt-8 flex w-3/5 flex-col gap-4">
      <div className="flex w-full flex-row justify-between">
        <div className="text-primary font-mono text-lg">Your podcasts</div>
        <NewPodcastDialog />
      </div>
      <div className="flex size-full flex-col gap-2 overflow-y-auto p-2 text-xs">
        {podcasts.length > 0 ? (
          podcasts.map((podcast, index) => <PodcastStrip key={index} podcast={podcast} manageable />)
        ) : (
          <div className="text-muted-foreground mt-6 font-mono text-base">
            You have not imported any podcasts yet. Click the <span className="text-primary">New podcast</span> button above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
