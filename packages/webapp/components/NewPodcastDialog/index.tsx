'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NewPodcastDialog() {
  const [rssUrl, setRssUrl] = useState<string | null>(null);

  const onImportClicked = async () => {
    // TODO
  }

  return (
    <Dialog>
      <DialogTrigger>
        <div className={cn(buttonVariants({ variant: 'secondary' }), 'font-mono text-sm')}>Import podcast</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Import Podcast</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground flex flex-col gap-4 font-mono">
          <div>First, enter the URL of your podcast&apos;s RSS feed.</div>
          <div className="flex flex-row gap-2 items-center">
            <Input className="w-full" placeholder="https://example.com/rss" />
            <Button onClick={onImportClicked} className="font-mono">Import</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
