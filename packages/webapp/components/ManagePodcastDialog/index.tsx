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
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
          Delete podcast
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
            <Button variant="destructive" className="font-mono" onClick={handleDelete}>
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManagePodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
  const numEpisodes = podcast.Episodes.length;
  const numTranscribed = podcast.Episodes.filter((episode) => episode.transcriptUrl !== null).length;
  const numSummarized = podcast.Episodes.filter((episode) => episode.summaryUrl !== null).length;
  const mostRecentlyPublished = podcast.Episodes
    ? podcast.Episodes.reduce((a, b) => ((a.pubDate || 0) > (b.pubDate || 0) ? a : b))
    : null;

  const handleRefresh = async () => {
    const res = await fetch(`/api/podcast/${podcast.slug}`, {
      method: 'POST',
      body: JSON.stringify({ refresh: true }),
    });
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
      <DialogContent>
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
              <span className="text-primary">{podcast.Episodes.length}</span> episodes total
            </div>
            <div>
              <span className="text-primary">
                {podcast.Episodes.filter((episode) => episode.transcriptUrl !== null).length}
              </span>{' '}
              transcribed
            </div>
            <div>
              <span className="text-primary">
                {podcast.Episodes.filter((episode) => episode.summaryUrl !== null).length}
              </span>{' '}
              summarized
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button className="font-mono" variant="secondary" onClick={handleRefresh}>
              <ArrowPathIcon className="size-5 mr-2 inline" />
              Refresh
            </Button>
          </DialogClose>
          <DeletePodcastDialog podcast={podcast} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
