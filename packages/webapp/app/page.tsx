'use server';

import Link from 'next/link';
import { auth } from '@clerk/nextjs';
import { buttonVariants } from '@/components/ui/button';
import { EpisodeList } from '@/components/EpisodeList';
import { PodcastList } from '@/components/PodcastList';
import { cn } from '@/lib/utils';

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
        {userId ? (
          <Link href="/dashboard" target="_blank" rel="noreferrer" className={cn('font-mono', buttonVariants())}>
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link href="/signup" target="_blank" rel="noreferrer" className={cn('font-mono', buttonVariants())}>
              Sign up now
            </Link>
            <Link
              target="_blank"
              rel="noreferrer"
              href="/learn-more"
              className={cn('font-mono', buttonVariants({ variant: 'outline' }))}
            >
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
        <div className="font-mono text-xl">Explore podcasts</div>
        <PodcastList />
      </div>
    </section>
  );
}
