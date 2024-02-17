'use client';

import { PodcastWithEpisodes } from 'podverse-utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import moment from 'moment';

function DeletePodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
  const handleDelete = async () => {
    // TODO
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button className="font-mono" variant='destructive'>Delete podcast</Button>
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
          <Button variant='destructive' className="font-mono" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManagePodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
  const numEpisodes = podcast.Episodes.length;
  const numTranscribed = podcast.Episodes.filter((episode) => episode.transcriptUrl !== null).length;
  const numSummarized = podcast.Episodes.filter((episode) => episode.summaryUrl !== null).length;
  const mostRecentlyPublished = podcast.Episodes.reduce((a, b) => ((a.pubDate || 0) > (b.pubDate || 0) ? a : b));

  const handleProcess = async () => {
    // TODO
  };

  return (
    <Dialog>
      <DialogTrigger>
        <div className="text-primary border p-2 rounded-lg">Manage</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">
            Manage Podcast <span className="text-primary">{podcast.title}</span>
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="text-sm text-muted-foreground flex flex-col gap-1 font-mono">
            <div>
              Most recent episode: <span className="text-primary">{moment(mostRecentlyPublished.pubDate).format("MMMM Do YYYY")}</span>
            </div>
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
          <Button
            className="font-mono"
            onClick={handleProcess}
            disabled={numEpisodes === 0 || (numTranscribed === numEpisodes && numSummarized === numEpisodes)}
          >
            Process episodes
          </Button>
          <DeletePodcastDialog podcast={podcast} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
