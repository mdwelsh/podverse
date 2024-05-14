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
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

function CopyLinkToClipboard({ url }: { url: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast.info('Link copied to clipboard');
  };

  return (
    <div className="p-2 flex flex-row items-center gap-1 cursor-pointer bg-muted rounded-full" onClick={copyToClipboard}>
      <LinkIcon className="size-4 text-primary" />
    </div>
  );
}

export function ShareButtons() {
  const pathname = usePathname();
  const url = `https://podverse.ai${pathname}`;
  return (
    <div className="flex flex-row gap-1 items-center">
      <span className="text-xs text-muted-foreground mr-1">Share:</span>
      <CopyLinkToClipboard url={url} />
      <EmailShareButton url={url} subject="Podverse AI">
        <EmailIcon size={32} round={true} />
      </EmailShareButton>
      <TwitterShareButton url={url}>
        <TwitterIcon size={32} round={true} />
      </TwitterShareButton>
      <FacebookShareButton url={url}>
        <FacebookIcon size={32} round={true} />
      </FacebookShareButton>
      <LinkedinShareButton url={url}>
        <LinkedinIcon size={32} round={true} />
      </LinkedinShareButton>
    </div>
  );
}
