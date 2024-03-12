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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EpisodeIndicator } from '../Indicators';

export function ManageEpisodeDialog({ episode, children }: { episode: Episode; children?: React.ReactNode }) {
  const [force, setForce] = useState(false);
  const status = episode.status as EpisodeStatus;
  const isPending = !status || !status.startedAt;
  const isProcessing = status && status.startedAt && !status.completedAt;
  const isError = status && status.message && status.message.startsWith('Error');
  const isComplete = !isPending && !isProcessing && !isError && status && status.completedAt;

  const handleProcess = async () => {
    setForce(false);
    // Send request to /api/episode/{episodeId}.
    const res = await fetch(`/api/episode/${episode.id}`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
    if (res.ok) {
      toast.success(`Started processing for episode ID ${episode.id}`);
    } else {
      toast.error('Failed to start processing: ' + (await res.text()));
    }
  };

  let statusMessage = status && status.message;
  let errorMessage = episode.error ? JSON.stringify(episode.error, null, 2) : null;

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-w-md md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono">Manage Episode</DialogTitle>
          <DialogDescription>{episode.title}</DialogDescription>
        </DialogHeader>
        <div className="flex w-auto flex-col gap-2">
          <div className="flex flex-row gap-2">
            <EpisodeIndicator episode={episode} />
            {isPending && <div>Processing not started</div>}
            {isProcessing && <div>{statusMessage || 'Processing'}</div>}
            {isError && <div>Error processing episode</div>}
            {isComplete && <div>Processed</div>}
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
          <div className="items-top mt-4 flex space-x-2">
            <Checkbox
              disabled={isProcessing || false}
              id="force"
              className="mt-1"
              checked={force}
              onCheckedChange={(val: boolean) => setForce(val)}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="force" className="text-muted-foreground font-mono">
                Force reprocessing
              </label>
              <div className="text-muted-foreground text-sm">
                Checking this box will overwrite any existing transcript and episode summary.
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="font-mono" onClick={handleProcess} disabled={isProcessing || false}>
              Process episode
            </Button>
          </DialogClose>
          <DialogClose asChild>
            {/* @ts-ignore */}
            <Button className="font-mono" variant="secondary" onClick={() => setForce(false)}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
