'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { PodcastWithEpisodes } from 'podverse-utils';
import { PodcastStrip } from '../PodcastStrip';
import { EpisodeStrip } from '../PodcastEpisodeList';

enum importStage {
  ENTER_URL,
  LOADING,
  VALIDATING,
}

export function NewPodcastDialog() {
  const [rssUrl, setRssUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<importStage>(importStage.ENTER_URL);
  const [podcast, setPodcast] = useState<PodcastWithEpisodes | null>(null);

  const onImportClicked = async () => {
    setError(null);
    if (!rssUrl) {
      setError('Please enter a valid URL');
      return;
    }
    try {
      const url = new URL(rssUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        setError('Please enter a valid URL');
        return;
      }
      setStage(importStage.LOADING);

      fetch('/api/podcast/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: rssUrl }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched: ', data);
          setPodcast(data.podcast);
          setStage(importStage.VALIDATING);
        })
        .catch((e) => {
          setStage(importStage.ENTER_URL);
          setError('Error reading podcast feed: ' + e.message);
        });
    } catch (e) {
      setError('Please enter a valid URL');
      return;
    }
  };

  const onConfirmClicked = async () => {
    fetch('/api/podcast/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: rssUrl }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Fetched: ', data);
        setPodcast(null);
        setStage(importStage.ENTER_URL);
        toast.success('Podcast imported successfully');
      })
      .catch((e) => {
        setStage(importStage.ENTER_URL);
        setPodcast(null);
        setError('Error reading podcast feed: ' + e.message);
      });
  };

  const onCancelClicked = async () => {
    toast.info('Podcast import cancelled');
  };

  return (
    <Dialog>
      <DialogTrigger>
        <div className={cn(buttonVariants({ variant: 'secondary' }), 'font-mono text-sm')}>Import podcast</div>
      </DialogTrigger>
      <DialogContent className="w-4/5 max-h-[800px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Import Podcast</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground flex flex-col gap-4 font-mono">
          <div className="flex flex-row gap-2 items-center">
            <Input
              className="w-full"
              placeholder="https://example.com/rss"
              value={rssUrl || ''}
              onInput={(e) => {
                setRssUrl((e.target as HTMLInputElement).value);
              }}
            />
            <Button onClick={onImportClicked} disabled={stage !== importStage.ENTER_URL} className="font-mono">
              Import
            </Button>
          </div>
          {stage === importStage.ENTER_URL && (
            <div className="text-primary text-sm font-mono">First, enter the URL of your podcast&apos;s RSS feed.</div>
          )}
          {stage === importStage.LOADING && (
            <div className="text-primary text-sm font-mono">Loading podcast RSS feed...</div>
          )}
          <div>{error && <div className="text-primary">{error}</div>}</div>
          <div>{stage === importStage.LOADING && <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />}</div>
          <div>
            {stage === importStage.VALIDATING && podcast && (
              <PodcastPreview podcast={podcast} onConfirm={onConfirmClicked} onCancel={onCancelClicked} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PodcastPreview({
  podcast,
  onConfirm,
  onCancel,
}: {
  podcast: PodcastWithEpisodes;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="text-primary text-sm">Here&apos;s a preview of your podcast:</div>
      <PodcastStrip podcast={podcast} />
      <div className="text-primary text-sm">Newest episodes</div>
      {podcast.Episodes.slice(0, 5).map((episode) => (
        <EpisodeStrip key={episode.id} podcast={podcast} episode={episode} />
      ))}
      <div className="flex flex-row gap-2 justify-end">
        <DialogClose asChild>
          <Button variant="default" onClick={onConfirm}>
            Looks good
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
      </div>
    </div>
  );
}
