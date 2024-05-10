'use client';

import Image from 'next/image';
import { CreateMessage, Message } from 'ai';
import { useChat } from 'ai/react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState, type RefObject } from 'react';
import Textarea from 'react-textarea-autosize';
import {
  ArrowDownIcon,
  PaperAirplaneIcon,
  UserIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { FC, memo } from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import { useAudioPlayer } from '@/components/AudioPlayer';
import { Button } from '@/components/ui/button';
import { timeString } from '@/lib/time';
import { useScrollAnchor } from '@/lib/use-scroll-anchor';
import { Icons } from '@/components/icons';
import { EpisodeWithPodcast, PodcastWithEpisodes } from 'podverse-utils';
import { useChatContext } from '@/components/ChatContext';

export const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children && prevProps.className === nextProps.className,
);

export function useEnterSubmit(): {
  formRef: RefObject<HTMLFormElement>;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
} {
  const formRef = useRef<HTMLFormElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      formRef.current?.requestSubmit();
      event.preventDefault();
    }
  };

  return { formRef, onKeyDown: handleKeyDown };
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
}: {
  onSubmit: (value: string) => Promise<void>;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
}) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!input?.trim()) {
          return;
        }
        setInput('');
        await onSubmit(input);
      }}
      ref={formRef}
    >
      <div className="relative flex max-h-60 w-full grow flex-row items-center justify-between">
        {isLoading && <div className="bg-background absolute inset-0 z-10 opacity-50" />}
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message"
          spellCheck={false}
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        />
        <div className="w-12">
          {isLoading ? (
            <Icons.spinner className="text-primary mx-auto size-6 animate-spin" />
          ) : (
            <Button variant="ghost" type="submit" size="icon" disabled={input === ''}>
              <PaperAirplaneIcon className="text-primary size-6" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function ChatPanel({
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messages,
  scrollToBottom,
  isAtBottom,
}: {
  isLoading: boolean;
  stop?: () => void;
  append?: any;
  reload?: () => void;
  input: string;
  setInput: (value: string) => void;
  messages?: any[];
  scrollToBottom: () => void;
  isAtBottom: boolean;
}) {
  return (
    <div className="bg-background absolute bottom-0 flex w-full flex-col gap-2">
      <div className="text-muted-foreground ml-auto">
        <Button variant="ghost" onClick={scrollToBottom}>
          <ArrowDownIcon className="mr-2 size-4" /> Scroll to bottom
        </Button>
      </div>
      <div className="border-t">
        <PromptForm
          onSubmit={async (value) => {
            await append({
              content: value,
              role: 'user',
            });
          }}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function PodverseIcon() {
  return <Image src="/images/podverse-logo.svg" alt="Podverse" width={32} height={32} />;
}

function ChatSuggestion({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <div
      className={
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:border-primary my-4 cursor-pointer rounded-2xl font-mono hover:border'
      }
      onClick={onClick}
    >
      <div className="mx-2 flex flex-row items-start gap-1">
        <div className="mt-4 w-12">
          <QuestionMarkCircleIcon className="size-6" />
        </div>
        <div className="break-words p-4 font-mono text-sm">{text}</div>
      </div>
    </div>
  );
}

function ChatPlay({ time, onClick }: { time: number; onClick: () => void }) {
  return (
    <div className="mt-4">
      <Button onClick={onClick}>
        <PlayCircleIcon className="size-6" />
        Listen at {timeString(time)}
      </Button>
    </div>
  );
}

function ChatMessage({ message, append, ...props }: { message: Message; append: (m: CreateMessage) => void }) {
  const color = message.role === 'user' ? 'text-sky-200' : 'text-foreground-muted';
  const audioPlayer = useAudioPlayer();
  let play: (() => void) | undefined = undefined;
  let seek: ((n: number) => void) | undefined = undefined;
  if (audioPlayer) {
    play = audioPlayer.play;
    seek = audioPlayer.seek;
  }

  const doPlay = (time: number) => {
    if (!play || !seek) {
      return;
    }
    seek(time);
    play();
  };

  const doQuery = async (query: string) => {
    await append({
      content: query,
      role: 'user',
    });
  };

  return (
    <div className={cn('group relative mb-4 flex items-start font-sans text-base')} {...props}>
      <div className="bg-background flex size-8 shrink-0 select-none items-center justify-center rounded-full">
        {message.role === 'user' ? (
          <UserIcon className="text-primary bg-secondary rounded-full p-1" />
        ) : (
          <PodverseIcon />
        )}
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        <MemoizedReactMarkdown
          className={`prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words ${color}`}
          //remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return (
                <div>
                  <div className="mb-2 last:mb-0">{children}</div>
                </div>
              );
            },
            code({ children }) {
              // TODO(mdw): Support code blocks.
              return <code className="mb-2 font-mono last:mb-0">{children}</code>;
            },
            a({ children, href }) {
              if (href?.startsWith('/?suggest')) {
                const suggestion = children as string;
                return <ChatSuggestion text={suggestion} onClick={() => doQuery(suggestion)} />;
              } else if (href?.startsWith('/?seek=')) {
                const time = parseFloat(href.split('=')[1]);
                return <ChatPlay time={time} onClick={() => doPlay(time)} />;
              } else {
                return (
                  <span className="text-primary underline">
                    <a href={href}>{children}</a>
                  </span>
                );
              }
            },
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
      </div>
    </div>
  );
}

function ChatList({ messages, append, endRef }: { messages: any[]; append: (m: CreateMessage) => void; endRef: any }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} append={append} />
      ))}
      <div className="h-px w-full" ref={endRef} />
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">Podverse chat</h1>
      </div>
    </div>
  );
}

export function Chat({
  greeting,
  suggestions,
  episodeId,
  podcastId,
}: {
  greeting?: string;
  suggestions?: string[];
  episodeId?: number;
  podcastId?: number;
}) {
  // We keep the randomized suggestions in state so it does not change on every render.
  const [randomSuggestions, setRandomSuggestions] = useState<string[]>([]);
  useEffect(() => {
    setRandomSuggestions(suggestions ? suggestions.sort(() => 0.5 - Math.random()).slice(0, 3) : []);
  }, [suggestions]);

  const initialMessages: CreateMessage[] = [
    {
      content:
        greeting ||
        "Hi there! I'm the Podverse AI Bot. You can ask me questions about any of the podcasts on this site.",
      role: 'assistant',
    },
  ];

  if (randomSuggestions.length) {
    initialMessages.push({
      content:
        'Here are some suggestions to get you started:\n' + randomSuggestions.map((s) => `[${s}](/?suggest)`).join(' '),
      role: 'assistant',
    });
  }

  const { messages, append, reload, stop, isLoading, input, setInput } = useChat({
    initialMessages: initialMessages.map((m, i) => ({ ...m, id: i.toString() })),
    body: { episodeId, podcastId },
  });
  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } = useScrollAnchor();

  return (
    <div className="relative flex h-full flex-col" ref={scrollRef}>
      <div className="overflow-y-auto pb-[100px]">
        {messages.length ? (
          <>
            <ChatList messages={messages} append={append} endRef={messagesRef} />
          </>
        ) : (
          <EmptyChat />
        )}
        <div className="h-px w-full" ref={visibilityRef} />
      </div>
      <ChatPanel
        append={append}
        isLoading={isLoading}
        stop={stop}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </div>
  );
}

export function ContextAwareChat() {
  const { podcast, episode } = useChatContext();
  const greeting =
    "Hi there! I'm the Podverse AI Bot. You can ask me questions about any of the podcasts on this site.";
  const suggestions = ['What are some good science podcasts?', 'Are there any episodes about music?', 'Report a bug'];

  if (episode) {
    return <EpisodeContextChat episode={episode} />;
  } else if (podcast) {
    return <PodcastContextChat podcast={podcast} />;
  } else {
    return <Chat greeting={greeting} suggestions={suggestions} />;
  }
}

export function PodcastContextChat({ podcast }: { podcast: PodcastWithEpisodes }) {
  const greeting = `Hi there! I\'m the Podverse AI Bot. You can ask me questions about the **${podcast.title}** podcast.`;
  return <Chat podcastId={podcast.id} greeting={greeting} suggestions={podcast.suggestions} />;
}

export function EpisodeContextChat({ episode }: { episode: EpisodeWithPodcast }) {
  const greeting = `Hi there! I\'m the Podverse AI Bot. You can ask me questions about **${episode.title}** or the **${episode.podcast.title}** podcast.`;
  return <Chat episodeId={episode.id} greeting={greeting} suggestions={episode.suggestions} />;
}
