'use client';

import { useEffect, useState } from 'react';
import { Podcast, PodcastWithEpisodes } from 'podverse-utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ArrowPathIcon,
  TrashIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deletePodcast, processPodcast, refreshPodcast, updatePodcast } from '@/lib/actions';
import { EpisodeLimit } from '@/lib/limits';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getPodcastWithEpisodes } from '@/lib/actions';

export function DeletePodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
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
          <TrashIcon className="mr-2 inline size-5" />
          Delete podcast
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Delete Podcast</DialogTitle>
        </DialogHeader>
        <div>
          <div className="text-muted-foreground flex flex-col gap-1 font-mono text-sm">
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
              <TrashIcon className="mr-2 inline size-5" />
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProcessPodcastDialog({ podcast, planLimit }: { podcast: PodcastWithEpisodes; planLimit: EpisodeLimit }) {
  const [numEpisodes, setNumEpisodes] = useState(planLimit.numToProcess);
  const showUpgradeMessage = planLimit.unprocessedEpisodes > planLimit.leftOnPlan;

  let upgradeMessage = (
    <div className="flex flex-row items-center gap-4">
      <ExclamationTriangleIcon className="text-primary size-20" />
      <div>
        You have processed <span className="text-primary">{planLimit.processedEpisodes}</span> out of{' '}
        <span className="text-primary">{planLimit.maxEpisodesPerPodcast}</span> episodes allowed for this podcast. You
        can{' '}
        <Link href="/pricing" className="text-primary underline">
          upgrade your plan
        </Link>{' '}
        to process more episodes.
      </div>
    </div>
  );

  // Four cases to consider here:
  // 1. Unprocessed episodes is zero. Simply means there's nothing to process.
  // 2. unprocessed > leftOnPlan, but leftOnPlan is > 0. This means the user is limited by the
  //    plan limit.
  // 3. unprocessed > leftOnPlan, but leftOnPlan === 0. This means the user is completely out of credits.

  let message = <></>;
  if (planLimit.unprocessedEpisodes === 0) {
    message = <div>No episodes to process.</div>;
  } else {
    message = (
      <div>
        {showUpgradeMessage && upgradeMessage}
        {planLimit.leftOnPlan > 0 && (
          <div>
            This will start processing <span className="text-primary">{numEpisodes}</span> out of{' '}
            <span className="text-primary">{planLimit.unprocessedEpisodes}</span> un-processed episodes.
          </div>
        )}
      </div>
    );
  }

  const processEnabled = planLimit.numToProcess > 0;
  const forceEnabled = processEnabled && planLimit.processedEpisodes > 0;

  const onProcess = () => {
    processPodcast(podcast.id.toString(), false, numEpisodes)
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
          <BoltIcon className="text-muted-foreground mr-2 size-5" /> Process episodes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Process episodes</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-8">
          <div className="text-muted-foreground my-4 flex flex-col gap-2 font-mono text-sm">{message}</div>
          {planLimit.numToProcess > 0 && (
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <div className="font-mono text-xs">1</div>
              <Slider
                defaultValue={[planLimit.numToProcess]}
                min={1}
                max={planLimit.numToProcess}
                step={1}
                onValueChange={(x) => setNumEpisodes(x[0])}
              />
              <div className="text-muted-foreground font-mono text-xs">{planLimit.numToProcess}</div>
            </div>
          )}
          {/* <div className="items-top mt-4 flex space-x-2"> */}
          {/* <Checkbox
              id="force"
              className="mt-1"
              disabled={!forceEnabled}
              checked={force}
              onCheckedChange={(val: boolean) => setForce(val)}
            /> */}
          {/* <div className="flex flex-col gap-1">
              <label htmlFor="force" className="text-muted-foreground font-mono">
                Re-process existing episodes
              </label>
              {processed > 0 && (
                <div className="text-muted-foreground text-sm">
                  Checking this box will also re-process <span className="text-primary">{processed}</span> episodes that
                  have already been processed.
                </div>
              )}
            </div> */}
          {/* </div> */}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" className="font-mono">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button className="font-mono" onClick={onProcess} disabled={!processEnabled}>
              <BoltIcon className="mr-2 inline size-5" />
              Process
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PublicPodcastSwitch({
  podcast,
  checked,
  onCheckedChange,
}: {
  podcast: Podcast;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="publish-episode" checked={checked} onCheckedChange={onCheckedChange} />
      <Label className="text-muted-foreground font-mono text-sm" htmlFor="publish-episode">
        Make podcast link public
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <QuestionMarkCircleIcon className="text-primary size-5 ml-1" />
            </TooltipTrigger>
            <TooltipContent className="text-muted-foreground w-[400px] font-sans text-sm">
              When this option is enabled, your podcast link will be public at{' '}
              <span className="text-primary font-mono">https://podverse.ai/podcast/{podcast.slug}</span>. Keep this
              option disabled if you wish to keep your podcast link private.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
    </div>
  );
}

export function PublishPodcastSwitch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="publish-episode" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <Label className="text-muted-foreground items-center font-mono text-sm" htmlFor="publish-episode">
        Discoverable
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <QuestionMarkCircleIcon className="text-primary size-5 ml-1" />
            </TooltipTrigger>
            <TooltipContent className="text-muted-foreground w-[400px] font-sans text-sm">
              When this option is enabled, your podcast will be featured on the home page, and discoverable through the
              search and AI Chat feature across the site. Keep this option disabled if you only wish your listeners to
              access your podcast via a direct link.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
    </div>
  );
}

export function ProcessPodcastSwitch({
  podcast,
  checked,
  onCheckedChange,
}: {
  podcast: Podcast;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="publish-episode" checked={checked} onCheckedChange={onCheckedChange} />
      <Label className="text-muted-foreground font-mono text-sm" htmlFor="publish-episode">
        Automatically process new episodes
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <QuestionMarkCircleIcon className="text-primary size-5 ml-1" />
            </TooltipTrigger>
            <TooltipContent className="text-muted-foreground w-[400px] font-sans text-sm">
              When this option is enabled, new episodes will be automatically processed, up to your plan limit.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
    </div>
  );
}

export function ManagePodcastGeneral({
  podcastSlug,
  planLimit,
}: {
  podcastSlug: string;
  planLimit: EpisodeLimit | null;
}) {
  const [podcast, setPodcast] = useState<PodcastWithEpisodes | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  //const [isPublished, setIsPublished] = useState(podcast.published || false);
  const [processEnabled, setProcessEnabled] = useState(false);

  useEffect(() => {
    if (podcast) {
      return;
    }
    getPodcastWithEpisodes(podcastSlug)
      .then((podcast) => {
        setPodcast(podcast);
        setIsPublic(!podcast.private);
        setProcessEnabled(podcast.process);
      })
      .catch((e) => {
        toast.error('Failed to fetch podcast: ' + e.message);
      });
  }, [podcastSlug, podcast]);

  const doRefresh = () => {
    if (!podcast) {
      return;
    }
    refreshPodcast(podcast.id.toString())
      .then(() => {
        toast.success(`Started refreshing podcast ${podcast.title}`);
      })
      .catch((e) => {
        toast.error('Failed to start refreshing: ' + e.message);
      });
  };

  const onPublicChange = (checked: boolean) => {
    if (!podcast) {
      return;
    }
    setIsPublic(checked);
    podcast.private = !checked;
    //podcast.published = checked;
    const { Episodes, suggestions, ...rest } = podcast;
    updatePodcast({ ...rest })
      .then(() => {
        toast.success(`Set public status to ${checked}`);
      })
      .catch((e) => {
        toast.error('Failed to update podcast: ' + e.message);
      });
  };

  const onProcessChange = (checked: boolean) => {
    if (!podcast) {
      return;
    }
    setProcessEnabled(checked);
    podcast.process = checked;
    const { Episodes, suggestions, ...rest } = podcast;
    updatePodcast({ ...rest })
      .then(() => {
        toast.success(`Set auto-process status to ${checked}`);
      })
      .catch((e) => {
        toast.error('Failed to update podcast: ' + e.message);
      });
  };

  // const onPublishChange = (checked: boolean) => {
  //   setIsPublished(checked);
  //   podcast.published = checked;
  //   const { Episodes, suggestions, ...rest } = podcast;
  //   updatePodcast({ ...rest })
  //     .then(() => {
  //       toast.success(`Set published status to ${checked}`);
  //     })
  //     .catch((e) => {
  //       toast.error('Failed to update podcast: ' + e.message);
  //     });
  // };

  return (
    <div className="flex flex-col items-start gap-8">
      {!podcast || planLimit === null ? (
        <div>Loading...</div>
      ) : (
        <>
          <PublicPodcastSwitch podcast={podcast} checked={isPublic} onCheckedChange={onPublicChange} />
          {/* For now, we tie the published state to the private state. At some point we might make these different. */}
          {/* <PublishPodcastSwitch checked={isPublished} onCheckedChange={onPublishChange} disabled={!isPublic} /> */}
          <ProcessPodcastSwitch podcast={podcast} checked={processEnabled} onCheckedChange={onProcessChange} />
          <div className="flex flex-row gap-4">
            <ProcessPodcastDialog podcast={podcast} planLimit={planLimit} />
            <Button className="font-mono" variant="secondary" onClick={doRefresh}>
              <ArrowPathIcon className="mr-2 inline size-5" />
              Fetch new episodes
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
