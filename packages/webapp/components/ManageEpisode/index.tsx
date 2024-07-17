'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EpisodeStatus, isPending, isProcessing, isError, isReady, EpisodeWithPodcast } from 'podverse-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { buttonVariants } from '@/components/ui/button';
import moment from 'moment';
import { toast } from 'sonner';
import { EpisodeIndicator } from '../Indicators';
import { BoltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { processEpisode } from '@/lib/actions';
import { useEpisodeLimit } from '@/lib/limits';
import { cn } from '@/lib/utils';
import { getEpisodeWithPodcast } from '@/lib/actions';
import { EpisodeHeader } from '@/components/EpisodeHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmbedEpisode } from '@/components/Embed';

export function ManageEpisode({ podcastSlug, episodeSlug }: { podcastSlug: string; episodeSlug: string }) {
  const [episode, setEpisode] = useState<EpisodeWithPodcast | null>(null);

  useEffect(() => {
    if (episode) {
      return;
    }
    getEpisodeWithPodcast(podcastSlug, episodeSlug)
      .then((episode) => {
        setEpisode(episode);
      })
      .catch((e) => {
        toast.error('Failed to fetch episode: ' + e.message);
      });
  }, [podcastSlug, episodeSlug, episode]);

  if (!episode) {
    return (
      <div className="mx-auto mt-8 w-full px-2 md:w-4/5 flex flex-col gap-4 h-64">
        <Skeleton />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto mt-8 w-full px-2 md:w-4/5 flex flex-col gap-4">
        <div className="font-mono text-2xl font-bold flex flex-row items-center gap-2">Manage episode</div>
        <EpisodeHeader episode={episode} showManage={false} />
        <div className="w-fit">
          <Link
            className={buttonVariants({ variant: 'default' })}
            href={`/podcast/${episode.podcast.slug}/episode/${episode.slug}`}
          >
            View episode
          </Link>
        </div>

        <Tabs defaultValue="general" className="w-90% mt-8" orientation="vertical">
          <div className="flex flex-row gap-16">
            <TabsList className="w-40% flex-col h-max items-start bg-transparent border border-muted">
              <TabsTrigger className="font-normal data-[state=active]:text-primary" value="general">
                General
              </TabsTrigger>
              <TabsTrigger className="font-normal data-[state=active]:text-primary" value="embed">
                Embed
              </TabsTrigger>
            </TabsList>
            <TabsContent className="w-60%" value="general">
              <ManageEpisodeGeneral episode={episode} />
            </TabsContent>
            <TabsContent className="w-60%" value="embed">
              <EmbedEpisode episode={episode} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}

function ManageEpisodeGeneral({ episode }: { episode: EpisodeWithPodcast }) {
  const [force, setForce] = useState(false);
  const planLimit = useEpisodeLimit(episode.podcast.id);
  if (!planLimit) {
    return (
      <div className="mx-auto mt-8 w-full px-2 md:w-4/5 flex flex-col gap-4">
        <Skeleton />
      </div>
    );
  }
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
    <div className="flex flex-row items-center gap-4 text-sm">
      <ExclamationTriangleIcon className="text-primary size-20" />
      <div>
        You have processed <span className="text-primary">{planLimit.processedEpisodes}</span> out of{' '}
        <span className="text-primary">{planLimit.maxEpisodesPerPodcast}</span> episodes allowed for this podcast
        on your {planLimit.plan.displayName} plan.
         You
        can{' '}
        <Link href="/pricing" className="text-primary underline">
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
    <div className="flex flex-col items-start gap-8">
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
      <div>
        {canProcess && (
          <div className={cn(buttonVariants({ variant: 'outline' }), 'font-mono')} onClick={handleProcess}>
            <BoltIcon className="text-muted-foreground size-5" /> Process
          </div>
        )}
      </div>
    </div>
  );
}
