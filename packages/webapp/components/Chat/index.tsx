'use client';

import Image from 'next/image';
import { Message } from 'ai';
import { useChat } from 'ai/react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, type RefObject } from 'react';
import Textarea from 'react-textarea-autosize';
import { UserIcon, PlayCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { FC, memo } from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import { useAudioPlayer } from '@/components/AudioPlayer';
import { Button, buttonVariants } from '@/components/ui/button';

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
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden">
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message."
          spellCheck={false}
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        />
        <div className="absolute right-0 top-4 sm:right-4"></div>
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
}: {
  isLoading: boolean;
  stop?: () => void;
  append?: any;
  reload?: () => void;
  input: string;
  setInput: (value: string) => void;
  messages?: any[];
}) {
  return (
    <div className="absolute bottom-0 w-full bg-background border-t">
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
  );
}

function PodverseIcon() {
  return <Image src="/images/podverse-logo.svg" alt="Podverse" width={32} height={32} />;
}

function timeString(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsRemainder = Math.floor(seconds % 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secondsRemainder.toString().padStart(2, '0')}`;
}

function ChatMessage({ message, ...props }: { message: Message }) {
  const color = message.role === 'user' ? 'text-sky-200' : 'text-foreground-muted';
  const audioPlayer = useAudioPlayer();
  if (!audioPlayer) {
    return null;
  }
  const { play, seek } = audioPlayer;

  const doQuery = (query: string) => {};

  return (
    <div className={cn('group relative mb-4 flex items-start font-sans text-base')} {...props}>
      <div className="bg-background flex size-8 shrink-0 select-none items-center justify-center rounded-full">
        {message.role === 'user' ? <UserIcon className="text-primary" /> : <PodverseIcon />}
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        <MemoizedReactMarkdown
          className={`prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words ${color}`}
          //remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return (
                <div>
                  <p className="mb-2 last:mb-0">{children}</p>
                </div>
              );
            },
            code({ children }) {
              // TODO(mdw): Support code blocks.
              return <code className="font-mono mb-2 last:mb-0">{children}</code>;
            },
            a({ children, href }) {
              if (href?.startsWith('/?suggest')) {
                const suggestion = children as string;
                return (
                  <div className={cn(buttonVariants({ variant: 'secondary' }), 'hover:text-primary w-fit font-mono p-8')} onClick={() => doQuery(suggestion)}>
                    <div className="flex flex-row gap-2 items-center">
                      <QuestionMarkCircleIcon className="size-10" />
                      <div className="font-sans">{suggestion}</div>
                    </div>
                  </div>
                );
              } else if (href?.startsWith('/?seek=')) {
                const time = parseFloat(href.split('=')[1]);
                return (
                  <div className="mt-4">
                    <Button onClick={() => seek(time)}>
                      <PlayCircleIcon className="size-6" />
                      Listen at {timeString(time)}
                    </Button>
                  </div>
                );
              } else {
                return (
                  <div>
                    <span className="text-primary underline">
                      <a href={href}>{children}</a>
                    </span>
                  </div>
                );
              }
            },
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
        {/* <ChatMessageActions message={message} /> */}
      </div>
    </div>
  );
}

function ChatList({ messages }: { messages: any[] }) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} />
      ))}
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
  initialMessages,
  episodeId,
  podcastId,
}: {
  initialMessages?: Message[];
  episodeId?: number;
  podcastId?: number;
}) {
  const { messages, append, reload, stop, isLoading, input, setInput } = useChat({
    initialMessages,
    body: { episodeId, podcastId },
  });

  return (
    <div className="relative flex h-full flex-col">
      <div className="overflow-y-auto pb-[100px]">
        {messages.length ? (
          <>
            <ChatList messages={messages} />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>
      <ChatPanel
        append={append}
        isLoading={isLoading}
        stop={stop}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
      />
    </div>
  );
}
