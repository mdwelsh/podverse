import { auth } from '@clerk/nextjs/server';
import { NewPodcastDialog } from '@/components/NewPodcastDialog';
import { PodcastStrip } from '@/components/PodcastStrip';
import { getCurrentSubscription, getPodcastStats } from '@/lib/actions';
import { Plan, PLANS, PodcastStat } from 'podverse-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function NewPodcastHeader({ podcast }: { podcast: PodcastStat }) {
  return (
    <div className="flex flex-row bg-sky-900 p-2 text-center text-white">
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-3">
          <div className="text-sm">You are now the owner of the podcast:</div>
          <div className="text-primary font-mono underline underline-offset-4">
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

async function CurrentPlanHeader() {
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  let existingSubscription = null;
  try {
    existingSubscription = await getCurrentSubscription();
  } catch (e) {
    console.error('Error getting current subscription:', e);
  }
  let existingPlan: Plan | undefined = undefined;
  if (existingSubscription) {
    existingPlan = Object.values(PLANS).find((p) => p.id === existingSubscription?.plan) ?? PLANS.free;
  } else if (userId && existingSubscription === null) {
    existingPlan = PLANS.free;
  }
  return (
    <div className="bg-secondary border-primary mb-12 rounded-xl border p-4 text-white">
      You are on the <span className="font-bold">{existingPlan!.displayName}</span> plan. Visit the{' '}
      <Link href="/pricing" className="text-primary underline">
        pricing page
      </Link>{' '}
      to change or cancel your plan.
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
      <div className="mx-auto mt-8 flex w-full flex-col gap-4 px-2 md:w-3/5">
        <CurrentPlanHeader />
        <div className="flex w-full flex-row justify-between">
          <div className="flex flex-col items-center gap-2 sm:flex-row">
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
            podcasts.map((podcast, index) => <PodcastStrip key={index} podcast={podcast} />)
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
