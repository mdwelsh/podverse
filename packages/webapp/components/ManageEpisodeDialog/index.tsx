'use client';

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
import { Button, buttonVariants } from '@/components/ui/button';
import moment from 'moment';
import { toast } from 'sonner';
import { EpisodeIndicator } from '../Indicators';
import { isPending, isProcessing, isError, isReady } from '@/lib/episode';
import { PublishEpisodeSwitch } from '../PublishEpisodeSwitch';
import { BoltIcon } from '@heroicons/react/24/outline';
import { updateEpisode, processEpisode } from '@/lib/actions';

export function ManageEpisodeDialog({ episode, children }: { episode: Episode; children?: React.ReactNode }) {
  const [force, setForce] = useState(false);
  const status = episode.status as EpisodeStatus;

  const handleProcess = async () => {
    setForce(false);
    try {
      const result = await processEpisode(episode.id.toString(), force);
      toast.success(`Started processing episode ${episode.title}`);
    } catch (e) {
      toast.error(`Failed to start processing: ${(e as { message: string }).message}`);
    }
  };

  let statusMessage = status && status.message;
  let errorMessage = episode.error ? JSON.stringify(episode.error, null, 2) : null;
  const processDisabled = isReady(episode) && !force;

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
          {!isPending(episode) && (
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
          <DialogClose asChild>
            <Button variant="outline" className="font-mono" onClick={handleProcess} disabled={processDisabled}>
              <BoltIcon className="size-5 text-muted-foreground" /> Process
            </Button>
          </DialogClose>
          <DialogClose asChild>
            {/* @ts-ignore */}
            <Button className="font-mono" variant="secondary" onClick={() => setForce(false)}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
