'use client';

import { Episode, EpisodeWithPodcast } from 'podverse-utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function PublishEpisodeSwitch({
  episode,
  checked,
  onCheckedChange,
}: {
  episode: Episode | EpisodeWithPodcast;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="publish-episode" checked={checked} onCheckedChange={onCheckedChange} />
      <Label className="text-muted-foreground font-mono text-sm" htmlFor="publish-episode">
        Publish
      </Label>
    </div>
  );
}
