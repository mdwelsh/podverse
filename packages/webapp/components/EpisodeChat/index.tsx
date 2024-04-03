'use client';

import { ContextAwareChat } from '@/components/Chat';

export function EpisodeChat({ chatAvailable }: { chatAvailable: boolean }) {
  return (
    <div className="mt-8 hidden h-[600px] w-2/5 flex-col gap-2 lg:flex">
      <div>
        <h1>Chat</h1>
      </div>
      <div className="size-full overflow-y-auto border p-4 text-xs">
        {chatAvailable ? <ContextAwareChat /> : <div className="text-muted-foreground text-sm">Chat not available</div>}
      </div>
    </div>
  );
}
