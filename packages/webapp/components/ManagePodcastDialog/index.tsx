'use client';

import { PodcastWithEpisodes } from 'podverse-utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon, TrashIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { isReady } from '@/lib/episode';
import { Checkbox } from '@/components/ui/checkbox';

function DeletePodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
  const router = useRouter();

  const handleDelete = async () => {
    const res = await fetch(`/api/podcast/${podcast.slug}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast.success(`Deleted podcast ${podcast.title}`);
    } else {
      toast.error('Failed to delete podcast: ' + (await res.text()));
    }
    router.push('/');
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button className="font-mono" variant="destructive">
          <TrashIcon className="size-5 mr-2 inline" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Delete Podcast</DialogTitle>
        </DialogHeader>
        <div>
          <div className="text-sm text-muted-foreground flex flex-col gap-1 font-mono">
            <div>Are you sure you want to delete this podcast?</div>
            <div>This action cannot be undone.</div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" className="font-mono">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" className="font-mono" onClick={handleDelete}>
              <TrashIcon className="size-5 mr-2 inline" />
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProcessPodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
  const [force, setForce] = useState(false);
  const numProcessed = podcast.Episodes.filter((episode) => isReady(episode)).length;
  const numToProcess = podcast.Episodes.filter((episode) => !isReady(episode)).length;

  const onProcess = async () => {
    setForce(false);
    const res = await fetch(`/api/podcast/${podcast.slug}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'process', force }),
    });
    if (res.ok) {
      toast.success(`Started processing for ${podcast.title}`);
    } else {
      toast.error('Failed to start processing: ' + (await res.text()));
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button className="font-mono">
          <BoltIcon className="size-5 mr-2 inline" />
          Process
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Process episodes</DialogTitle>
        </DialogHeader>
        <div>
          <div className="text-sm text-muted-foreground flex flex-col gap-1 font-mono">
            <div>
              This will start processing <span className="text-primary">{numToProcess}</span> episodes for this podcast.
            </div>
          </div>
          <div className="items-top mt-4 flex space-x-2">
            <Checkbox id="force" className="mt-1" checked={force} onCheckedChange={(val: boolean) => setForce(val)} />
            <div className="flex flex-col gap-1">
              <label htmlFor="force" className="text-muted-foreground font-mono">
                Also re-process existing episodes
              </label>
              <div className="text-muted-foreground text-sm">
                Checking this box will also re-process <span className="text-primary">{numProcessed}</span> episodes that
                have already been processed.
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" className="font-mono">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button className="font-mono" onClick={onProcess}>
              <BoltIcon className="size-5 mr-2 inline" />
              Process
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManagePodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
  const [refreshing, setRefreshing] = useState(false);
  const mostRecentlyPublished = podcast.Episodes
    ? podcast.Episodes.reduce((a, b) => ((a.pubDate || 0) > (b.pubDate || 0) ? a : b))
    : null;

  const doRefresh = async () => {
    setRefreshing(true);
    console.log('STarting refresh');
    const res = await fetch(`/api/podcast/${podcast.slug}`, {
      method: 'POST',
      body: JSON.stringify({ refresh: true }),
    });
    setRefreshing(false);
    if (!res.ok) {
      toast.error('Failed to refresh podcast: ' + (await res.text()));
      return;
    }
    const updated = await res.json();
    toast.success(`Updated podcast - ${updated.Episodes.length} episodes processed`);
  };

  return (
    <Dialog>
      <DialogTrigger>
        <div className={cn(buttonVariants({ variant: 'secondary' }))}>Manage podcast</div>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono">
            Manage Podcast <span className="text-primary">{podcast.title}</span>
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="text-sm text-muted-foreground flex flex-col gap-1 font-mono">
            {mostRecentlyPublished && (
              <div>
                Most recent episode:{' '}
                <span className="text-primary">{moment(mostRecentlyPublished.pubDate).format('MMMM Do YYYY')}</span>
              </div>
            )}
            <div>
              <span className="text-primary">{podcast.Episodes.filter((episode) => isReady(episode)).length}</span>{' '}
              episodes processed / <span className="text-primary">{podcast.Episodes.length}</span> total
            </div>
            <div></div>
          </div>
        </div>
        <DialogFooter>
          <Button className="font-mono" variant="secondary" onClick={doRefresh} disabled={refreshing}>
            {refreshing ? (
              <ArrowPathIcon className="size-5 mr-2 inline animate-spin" />
            ) : (
              <ArrowPathIcon className="size-5 mr-2 inline" />
            )}
            Refresh
          </Button>
          <ProcessPodcastDialog podcast={podcast} />
          <DeletePodcastDialog podcast={podcast} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
