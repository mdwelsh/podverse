'use client';

import { GetPodcastWithEpisodesByID, PodcastWithEpisodes } from 'podverse-utils';
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
import moment, { max } from 'moment';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon, TrashIcon, BoltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { isReady } from '@/lib/episode';
import { Checkbox } from '@/components/ui/checkbox';
import { Usage } from '@/lib/plans';
import Link from 'next/link';
import { getUsage, deletePodcast, processPodcast, refreshPodcast, getPodcastWithEpisodes } from '@/lib/actions';

function DeletePodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
  const router = useRouter();

  const handleDelete = () => {
    deletePodcast(podcast.slug)
      .then(() => {
        toast.success(`Deleted podcast ${podcast.title}`);
        router.push('/');
      })
      .catch((e) => toast.error('Failed to delete podcast: ' + e.message));
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
  const [usage, setUsage] = useState<Usage | null>(null);
  const [force, setForce] = useState(false);
  const [numToProcess, setNumToProcess] = useState(0);

  const total = podcast.Episodes.length;
  const processed = podcast.Episodes.filter((episode) => isReady(episode)).length;

  useEffect(() => {
    getUsage()
      .then((usageRecord) => {
        setUsage(usageRecord);
        const plan = usageRecord?.plan;
        const limit = Math.min(total, plan.maxEpisodesPerPodcast || total);
        const available = force ? limit : Math.max(0, limit - processed);
        setNumToProcess(available);
      })
      .catch((e) => console.error(e));
  }, [force, podcast.Episodes, processed, total]);

  let message = (
    <div>
      This will start processing <span className="text-primary">{numToProcess}</span> episodes for this podcast.
    </div>
  );
  if (usage && usage.plan.maxEpisodesPerPodcast !== null) {
    message = (
      <div>
        <div>
          This will start processing <span className="text-primary">{numToProcess}</span> episodes for this podcast.
        </div>
        <div>
          Your current plan has a limit of{' '}
          <span className="text-primary">{usage.plan.maxEpisodesPerPodcast} episodes</span> per podcast. You can{' '}
          <Link href="/plans" className="underline text-primary">
            upgrade your plan
          </Link>{' '}
          to process more episodes.
        </div>
      </div>
    );
  }

  if (numToProcess === 0) {
    if (processed === total) {
      message = <div>No episodes to process.</div>;
    } else if (usage && usage.plan.maxEpisodesPerPodcast !== null) {
      message = (
        <div className="flex flex-row items-center gap-4">
          <ExclamationTriangleIcon className="size-20 text-primary" />
          <div>
            Your current plan has a limit of{' '}
            <span className="text-primary">{usage.plan.maxEpisodesPerPodcast} episodes</span> per podcast. You can{' '}
            <Link href="/plans" className="underline text-primary">
              upgrade your plan
            </Link>{' '}
            to process more episodes.
          </div>
        </div>
      );
    } else {
      message = <div>Calculating...</div>;
    }
  }
  const processEnabled = numToProcess > 0;
  const forceEnabled = processEnabled && processed > 0;

  const onProcess = () => {
    setForce(false);
    processPodcast(podcast.id.toString(), force)
      .then(() => {
        toast.success(`Started processing for ${podcast.title}`);
      })
      .catch((e) => {
        toast.error('Failed to start processing: ' + e.message);
      });
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" className="font-mono">
          <BoltIcon className="size-5 mr-2 text-muted-foreground" /> Process
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Process episodes</DialogTitle>
        </DialogHeader>
        <div>
          <div className="text-sm text-muted-foreground flex flex-col gap-1 font-mono">{message}</div>
          <div className="items-top mt-4 flex space-x-2">
            <Checkbox
              id="force"
              className="mt-1"
              disabled={!forceEnabled}
              checked={force}
              onCheckedChange={(val: boolean) => setForce(val)}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="force" className="text-muted-foreground font-mono">
                Re-process existing episodes
              </label>
              {processed > 0 && (
                <div className="text-muted-foreground text-sm">
                  Checking this box will also re-process <span className="text-primary">{processed}</span> episodes that
                  have already been processed.
                </div>
              )}
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
            <Button className="font-mono" onClick={onProcess} disabled={!processEnabled}>
              <BoltIcon className="size-5 mr-2 inline" />
              Process
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManagePodcastDialog({ podcastSlug }: { podcastSlug: string }) {
  const [podcast, setPodcast] = useState<PodcastWithEpisodes | null>(null);

  useEffect(() => {
    getPodcastWithEpisodes(podcastSlug)
      .then((podcast) => setPodcast(podcast))
      .catch((e) => console.error(e));
  }, [podcastSlug]);

  const doRefresh = () => {
    if (podcast) {
      refreshPodcast(podcast.id.toString())
        .then(() => {
          toast.success(`Started refreshing podcast ${podcast.title}`);
        })
        .catch((e) => {
          toast.error('Failed to start refreshing: ' + e.message);
        });
    }
  };

  if (!podcast) {
    return null;
  }
  const mostRecentlyPublished = podcast.Episodes
    ? podcast.Episodes.reduce((a, b) => ((a.pubDate || 0) > (b.pubDate || 0) ? a : b))
    : null;

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
          <div className="text-sm text-muted-foreground flex flex-col gap-4 font-mono">
            {mostRecentlyPublished && (
              <div className="flex flex-col gap-2">
                <div>
                  Most recent episode: <span className="text-primary">{mostRecentlyPublished.title}</span>
                </div>
                <div>
                  published{' '}
                  <span className="text-primary">{moment(mostRecentlyPublished.pubDate).format('MMMM Do YYYY')}</span>
                </div>
              </div>
            )}
            <div>
              <span className="text-primary">{podcast.Episodes.filter((episode) => isReady(episode)).length}</span>{' '}
              episodes processed out of <span className="text-primary">{podcast.Episodes.length}</span> total
            </div>
            <div></div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button className="font-mono" variant="secondary" onClick={doRefresh}>
              <ArrowPathIcon className="size-5 mr-2 inline" />
              Fetch new episodes
            </Button>
          </DialogClose>
          <ProcessPodcastDialog podcast={podcast} />
          <DeletePodcastDialog podcast={podcast} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
