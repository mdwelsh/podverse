'use client';

import { LinkIcon } from '@heroicons/react/24/outline';
import {
  EmailShareButton,
  EmailIcon,
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  LinkedinIcon,
  LinkedinShareButton,
} from 'react-share';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

function CopyLinkToClipboard({ url, disabled }: { url: string; disabled?: boolean }) {
  const copyToClipboard = () => {
    if (disabled) {
      return;
    }
    navigator.clipboard.writeText(url);
    toast.info('Link copied to clipboard');
  };

  return (
    <div
      className="bg-muted flex cursor-pointer flex-row items-center gap-1 rounded-full p-2"
      onClick={copyToClipboard}
    >
      <LinkIcon className="text-primary size-4" />
    </div>
  );
}

function DisabledTooltip({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{children}</TooltipTrigger>
          <TooltipContent className="text-muted-foreground w-[400px] font-sans text-sm">
            Sharing is disabled for private podcasts. Set this podcast to public to enable sharing.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    return <>{children}</>;
  }
}

export function ShareButtons({ disabled }: { disabled?: boolean }) {
  const pathname = usePathname();
  const url = `https://podverse.ai${pathname}`;
  return (
    <DisabledTooltip disabled={disabled}>
      <div className="flex flex-row items-center gap-1">
        <span className="text-muted-foreground mr-1 text-xs">Share:</span>
        <CopyLinkToClipboard url={url} disabled={disabled} />
        <EmailShareButton url={url} subject="Podverse AI" disabled={disabled}>
          <EmailIcon size={32} round={true} />
        </EmailShareButton>
        <TwitterShareButton url={url} disabled={disabled}>
          <TwitterIcon size={32} round={true} />
        </TwitterShareButton>
        <FacebookShareButton url={url} disabled={disabled}>
          <FacebookIcon size={32} round={true} />
        </FacebookShareButton>
        <LinkedinShareButton url={url} disabled={disabled}>
          <LinkedinIcon size={32} round={true} />
        </LinkedinShareButton>
      </div>
    </DisabledTooltip>
  );
}
