'use server';

import Link from 'next/link';
import { auth } from '@clerk/nextjs';
import { buttonVariants } from '@/components/ui/button';
import { EpisodeList } from '@/components/EpisodeList';
import { PodcastList } from '@/components/PodcastList';
import { cn } from '@/lib/utils';
import { ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { ChatPanel } from '@/components/ChatPanel';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// Use dynamic rendering, since we fetch live data.
//export const dynamicParams = true;
//export const revalidate = 60;

export default async function HomePage() {
  const { userId } = auth();

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="font-mono text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          AI superpowers for your podcast.
        </h1>
        <p className="text-muted-foreground max-w-[700px] font-mono text-lg">
          Automatic episode transcripts, summaries, AI chat, and more.
          <br />
          Take your podcast to the next level.
        </p>
      </div>
      <div className="flex gap-4">
        <ChatPanel>
          <Button variant="outline" className="border-primary font-mono">
            <div className="flex flex-row items-center gap-2">
              <Image src="/images/podverse-logo.svg" alt="Podverse" width={30} height={30} />
              AI Chat
            </div>
          </Button>
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
        <div className="font-mono text-xl">Latest episodes</div>
        <EpisodeList />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-row gap-8 items-center">
          <div className="font-mono text-xl">Explore podcasts</div>
          <div>
            <Link className={cn('font-mono', buttonVariants({ variant: 'outline' }))} href="/explore">
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
