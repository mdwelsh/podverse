import { ChatContextProvider } from '@/components/ChatContext';
import { ContextAwareChat } from '@/components/Chat';
import Link from 'next/link';

export function ChatEmbed({ podcastSlug, episodeSlug }: { podcastSlug: string; episodeSlug?: string }) {
  const pageLink = `/podcast/${podcastSlug}` + (episodeSlug ? `/episode/${episodeSlug}` : '');
  return (
    <div className="flex w-full flex-col gap-2 px-2">
      <ChatContextProvider>
        <ContextAwareChat />
      </ChatContextProvider>
      <div className="mx-auto text-xs text-muted-foreground">
        Powered by{' '}
        <Link className="underline" href={pageLink}>
          Podverse
        </Link>
      </div>
    </div>
  );
}
