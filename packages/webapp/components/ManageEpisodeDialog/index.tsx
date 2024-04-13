'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Episode, EpisodeStatus } from 'podverse-utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { buttonVariants } from '@/components/ui/button';
import moment from 'moment';
import { toast } from 'sonner';
import { EpisodeIndicator } from '../Indicators';
import { isPending, isProcessing, isError, isReady } from '@/lib/episode';
import { BoltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { processEpisode } from '@/lib/actions';
import { usePlanLimit } from '@/lib/limits';
import { cn } from '@/lib/utils';

export function ManageEpisodeDialog({ episode, children }: { episode: Episode; children?: React.ReactNode }) {
  const [force, setForce] = useState(false);
  const planLimit = usePlanLimit(episode.podcast);
  if (!planLimit) {
    return null;
  }
  console.log(planLimit);
  const status = episode.status as EpisodeStatus;
  const canProcess = planLimit.leftOnPlan > 0;

  const handleProcess = async () => {
    setForce(false);
    try {
      toast.success(`Started processing episode ${episode.title}`);
      await processEpisode(episode.id.toString(), force);
    } catch (e) {
      toast.error(`Failed to start processing: ${(e as { message: string }).message}`);
    }
  };

  let upgradeMessage = (
    <div className="flex flex-row items-center gap-4">
      <ExclamationTriangleIcon className="text-primary size-20" />
      <div>
        You have processed <span className="text-primary">{planLimit.processedEpisodes}</span> out of{' '}
        <span className="text-primary">{planLimit.maxEpisodesPerPodcast}</span> episodes allowed for this podcast. You
        can{' '}
        <Link href="/plans" className="text-primary underline">
          upgrade your plan
        </Link>{' '}
        to process more episodes.
      </div>
    </div>
  );

  let statusMessage = status && status.message;
  let errorMessage = episode.error ? JSON.stringify(episode.error, null, 2) : null;
  const processingAllowed = force || canProcess;

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-w-md md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono">Manage Episode</DialogTitle>
          <DialogDescription>
            <span className="text-primary">{episode.title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-auto flex-col gap-2">
          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-2">
              <EpisodeIndicator episode={episode} />
              {isPending(episode) && <div>Processing not started</div>}
              {isProcessing(episode) && <div>{statusMessage || 'Processing'}</div>}
              {isError(episode) && <div>Error processing episode</div>}
              {isReady(episode) && <div>Processed</div>}
            </div>
          </div>
          {errorMessage && (
            <div className="w-sm md:w-2xl mx-auto max-h-[300px] max-w-sm overflow-scroll text-wrap rounded-2xl border border-red-500 p-2 md:max-w-2xl">
              <div className="text-muted-foreground truncate font-mono text-xs">
                <p>
                  <pre>{errorMessage}</pre>
                </p>
              </div>
            </div>
          )}
          <div className="text-muted-foreground flex flex-col gap-1 font-mono text-sm">
            <div>{status && status.startedAt && `Started processing ${moment(status.startedAt).fromNow()}`}</div>
            <div>{status && status.completedAt && `Finished processing ${moment(status.completedAt).fromNow()}`}</div>
          </div>
          {!processingAllowed && upgradeMessage}
          {!isPending(episode) && processingAllowed && (
            <div className="items-top mt-4 flex space-x-2">
              <Checkbox id="force" className="mt-1" checked={force} onCheckedChange={(val: boolean) => setForce(val)} />
              <div className="flex flex-col gap-1">
                <label htmlFor="force" className="text-muted-foreground font-mono">
                  Force reprocessing
                </label>
                <div className="text-muted-foreground text-sm">
                  Checking this box will overwrite any existing transcript and episode summary.
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {canProcess && (
            <DialogClose asChild>
              <div className={cn(buttonVariants({ variant: 'outline' }), 'font-mono')} onClick={handleProcess}>
                <BoltIcon className="text-muted-foreground size-5" /> Process
              </div>
            </DialogClose>
          )}
          <DialogClose asChild>
            {/* @ts-ignore */}
            <div className={cn(buttonVariants({ variant: 'secondary' }), 'font-mono')} onClick={() => setForce(false)}>
              Close
            </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
