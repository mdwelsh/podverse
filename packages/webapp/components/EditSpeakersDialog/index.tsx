'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Episode } from 'podverse-utils';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

export function EditSpeakersDialog({ episode }: { episode: Episode }) {
  return (
    <Dialog>
      <DialogTrigger>
        <div className="text-primary flex flex-row gap-2 font-mono text-xs border border-muted-foreground rounded-lg p-2 m-2">
          <PencilSquareIcon className="size-4" />
          Edit
        </div>
      </DialogTrigger>
      <DialogContent className="max-h-[800px] w-4/5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit speakers</DialogTitle>
        </DialogHeader>
        stuff
      </DialogContent>
    </Dialog>
  );
}
