'use client';

import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EpisodeWithPodcast } from 'podverse-utils';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { updateSpeaker } from '@/lib/actions';

export function EditSpeakersDialog({ episode, speaker }: { episode: EpisodeWithPodcast; speaker: string }) {
  const curName = episode.speakers?.[speaker] || `Speaker ${speaker}`;
  const [name, setName] = useState(curName);

  const onConfirm = () => {
    updateSpeaker(episode.id, speaker, name)
      .then(() => {
        toast.success('Speaker name updated');
      })
      .catch((e) => {
        console.error('Error updating speaker name', e);
        toast.error('Error updating speaker name: ' + e.message);
      });
  };

  const onCancel = () => {};

  return (
    <Dialog>
      <DialogTrigger>
        <div className="text-muted-foreground flex flex-row gap-2 font-mono text-xs">
          <PencilSquareIcon className="size-4" />
          Edit name
        </div>
      </DialogTrigger>
      <DialogContent className="max-h-[800px] w-4/5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit speaker name</DialogTitle>
        </DialogHeader>
        <div className="flex flex-row gap-2">
          <Input className="w-3/5" placeholder={curName} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-row gap-2 justify-end">
          <DialogClose asChild>
            <Button variant="default" onClick={onConfirm}>
              Set name
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
