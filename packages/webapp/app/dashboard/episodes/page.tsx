import { auth } from '@clerk/nextjs/server';
import { NewPodcastDialog } from '@/components/NewPodcastDialog';
import Link from 'next/link';
import { EpisodeTable } from '@/components/EpisodeStatus';
import { Button } from '@/components/ui/button';

export default async function Page() {
  const { userId, protect } = auth();
  protect();
  if (!userId) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 flex w-full px-2 sm:w-4/5 flex-col gap-4">
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-col smflex-row gap-2 items-center">
          <div className="font-mono text-lg">Your episodes</div>
          <Link href="/dashboard">
            <Button variant="outline" className="text-sm">
              View podcasts
            </Button>
          </Link>
        </div>
        <NewPodcastDialog />
      </div>
      <div className="flex size-full flex-col gap-2 overflow-y-auto p-2 text-xs">
        <EpisodeTable />
      </div>
    </div>
  );
}
