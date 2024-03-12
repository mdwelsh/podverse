// We specify this as a client component because it is used in the client graph via
// EpisodeDetail. For some reason, webpack seems to break if we try to use it as a server
// component elsewhere.
'use client';

import { Episode, EpisodeStatus, EpisodeWithPodcast } from 'podverse-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/components/icons';
import { BoltSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { isPending, isProcessing, isError, isReady } from '@/lib/episode';

export function EpisodeIndicator({ episode }: { episode: Episode | EpisodeWithPodcast }) {
  let icon = <CheckCircleIcon className="text-primary inline size-6" />;

  if (isPending(episode as Episode)) {
    icon = <BoltSlashIcon className="text-muted-foreground inline size-6" />;
  } else if (isProcessing(episode as Episode)) {
    icon = <Icons.spinner className="text-primary mx-auto size-5 animate-spin" />;
  } else if (isError(episode as Episode)) {
    icon = <ExclamationTriangleIcon className="text-primary inline size-6" />;
  }
  return <div className="w-fit">{icon}</div>;
}

export function EpisodeTooltip({ episode }: { episode: Episode | EpisodeWithPodcast }) {
  const status = episode.status as EpisodeStatus;
  let message = (status && status.message) ?? 'Processing completed';

  if (isPending(episode as Episode)) {
    message = 'Processing not started';
  } else if (isProcessing(episode as Episode)) {
    message = 'Processing';
  } else if (isError(episode as Episode)) {
    message = 'Error processing episode';
  }

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <EpisodeIndicator episode={episode} />
          </TooltipTrigger>
          <TooltipContent className="text-primary text-xs">
            <p>{message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
