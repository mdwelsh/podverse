import { ChatContextProvider } from '@/components/ChatContext';
import { ContextAwareChat } from '@/components/Chat';
import Link from 'next/link';
import { PoweredBy } from '../PoweredBy';

export function ChatEmbed({ podcastSlug, episodeSlug }: { podcastSlug: string; episodeSlug?: string }) {
  const pageLink = `/podcast/${podcastSlug}` + (episodeSlug ? `/episode/${episodeSlug}` : '');
  return (
    <div className="flex w-full flex-col gap-2 px-2">
      <ChatContextProvider>
        <div className="mx-auto mt-2">
          <PoweredBy />
        </div>
        <ContextAwareChat embed={true} />
      </ChatContextProvider>
    </div>
  );
}
