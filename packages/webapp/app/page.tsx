'use server';

import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { buttonVariants } from '@/components/ui/button';
import { EpisodeList } from '@/components/EpisodeList';
import { PodcastList } from '@/components/PodcastList';
import { cn } from '@/lib/utils';
import { ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { ChatPanel } from '@/components/ChatPanel';
import Image from 'next/image';

export default async function HomePage() {
  const { userId } = auth();

  return (
    <section className="container grid w-full items-center gap-6 p-2 pb-8 pt-6 md:p-4 md:py-10">
      <div className="flex w-full flex-col items-start gap-2">
        <h1 className="font-mono text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          AI superpowers for your podcast.
        </h1>
        <p className="text-muted-foreground max-w-[700px] font-mono text-base md:text-lg">
          Automatic episode transcripts, summaries, AI chat, and more.
          <br />
          Take your podcast to the next level.
        </p>
      </div>
      <div className="flex flex-col gap-4 px-20 md:flex-row md:px-0">
        <ChatPanel>
          <div className={cn(buttonVariants({ variant: 'outline' }), 'border-primary w-full font-mono')}>
            <div className="flex flex-row items-center gap-2">
              <Image src="/images/podverse-logo.svg" alt="Podverse" width={30} height={30} />
              AI Chat
            </div>
          </div>
        </ChatPanel>
        {userId ? (
          <Link
            href="/dashboard"
            target="_blank"
            rel="noreferrer"
            className={cn('font-mono', buttonVariants({ variant: 'secondary' }))}
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              target="_blank"
              rel="noreferrer"
              className={cn('font-mono', buttonVariants({ variant: 'default' }))}
            >
              Sign up now
            </Link>
            <Link href="/about" className={cn('font-mono', buttonVariants({ variant: 'secondary' }))}>
              Learn more
            </Link>
          </>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <div className="font-mono text-base sm:text-xl">Latest episodes</div>
        <EpisodeList />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-8">
          <div className="font-mono text-base sm:text-xl">Explore podcasts</div>
          <div className="text-xs">
            <Link className={cn(buttonVariants({ variant: 'outline' }), 'font-mono text-xs sm:text-sm')} href="/explore">
              View all
              <ChevronDoubleRightIcon className="ml-2 inline size-4" />
            </Link>
          </div>
        </div>
        <PodcastList limit={8} />
      </div>
    </section>
  );
}
