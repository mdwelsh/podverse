import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { buttonVariants } from '@/components/ui/button';
import { EpisodeList } from '@/components/EpisodeList';
import { PodcastList } from '@/components/PodcastList';
import { cn } from '@/lib/utils';
import { ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { ChatPanel } from '@/components/ChatPanel';
import Image from 'next/image';
import { SignupOrLogin } from '@/components/SignupOrLogin';
import { ZoomableImage } from '@/components/ZoomableImage';

function DesktopHeroImage({width, height}: { width?: number, height?: number }) {
  return (
    <ZoomableImage
      src="/images/podverse-episode-screenshot.png"
      alt="Podverse Episode Screenshot"
      width={width || 600}
      height={height || 600}
    >
      The Podverse episode page, with transcript, summary, and AI chat.
    </ZoomableImage>
  );
}

export default async function HomePage() {
  const { userId } = auth();

  return (
    <section className="container grid w-full items-center gap-6 p-4 pb-8 pt-6 md:p-4 md:py-10">
      <div className="flex w-full flex-row gap-2">
        <div className="flex w-4/5 flex-col items-start gap-6">
          <h1 className="font-mono text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
            AI superpowers for your podcast.
          </h1>
          <p className="text-muted-foreground max-w-[700px] font-mono text-base md:text-lg text-pretty">
            Automatic episode transcripts, summaries, AI chat, and more.
            Take your podcast to the next level.
          </p>
          <div className="md:hidden flex flex-row w-full">
            <div className="mx-auto">
              <DesktopHeroImage width={350} height={350} />
            </div>
          </div>
          <div className="flex flex-row gap-4 md:px-20 md:flex-row md:px-0">
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
                <SignupOrLogin text="Get started for free" />
                <Link href="/about" className={cn('font-mono', buttonVariants({ variant: 'secondary' }))}>
                  Learn more
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="w-2/5 hidden md:block">
          <DesktopHeroImage />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <div className="font-mono text-base sm:text-xl">Featured episodes</div>
        <EpisodeList />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-8">
          <div className="font-mono text-base sm:text-xl">Featured podcasts</div>
          <div className="text-xs">
            <Link
              className={cn(buttonVariants({ variant: 'outline' }), 'font-mono text-xs sm:text-sm')}
              href="/featured"
            >
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
