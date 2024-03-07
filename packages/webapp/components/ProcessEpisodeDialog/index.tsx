'use client';

import { useState } from 'react';
import { Episode } from 'podverse-utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
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

export function ProcessEpisodeDialog({ episode }: { episode: Episode }) {
  const [force, setForce] = useState(false);

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

  return (
    <Dialog>
      <DialogTrigger>
        <div className={cn(buttonVariants({ variant: 'secondary' }))}>Manage</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Process Episode</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground flex flex-col gap-1 font-mono text-sm">
            <div>
              Published <span className="text-primary">{moment(episode.pubDate).format('MMMM Do YYYY')}</span>
            </div>
            <div>
              Last modified <span className="text-primary">{moment(episode.modified_at).format('MMMM Do YYYY')}</span>
            </div>
          </div>
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="font-mono" onClick={handleProcess}>
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
