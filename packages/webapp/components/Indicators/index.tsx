// We specify this as a client component because it is used in the client graph via
// EpisodeDetail. For some reason, webpack seems to break if we try to use it as a server
// component elsewhere.
"use client";  

import { Episode, EpisodeWithPodcast } from 'podverse-utils';
import { ChatBubbleLeftRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TranscriptIndicator({ episode }: { episode: Episode | EpisodeWithPodcast }) {
  if (episode.transcriptUrl !== null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <ChatBubbleLeftRightIcon className="h-4 w-4 inline" />
          </TooltipTrigger>
          <TooltipContent className="text-xs text-primary">
            <p>Transcript available</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    return null;
  }
}

export function SummaryIndicator({ episode }: { episode: Episode | EpisodeWithPodcast }) {
  if (episode.summaryUrl !== null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <DocumentTextIcon className="h-4 w-4 inline" />
          </TooltipTrigger>
          <TooltipContent className="text-xs text-primary">
            <p>Summary available</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    return null;
  }
}

export function EpisodeIndicators({ episode }: { episode: Episode | EpisodeWithPodcast }) {
  return (
    <div className="flex flex-row items-center gap-2 text-xs text-muted-foreground">
      <TranscriptIndicator episode={episode} />
      <SummaryIndicator episode={episode} />
    </div>
  );
}
