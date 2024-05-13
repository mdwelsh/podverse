import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { buttonVariants } from '@/components/ui/button';
import { EpisodeList } from '@/components/EpisodeList';
import { PodcastList } from '@/components/PodcastList';
import { cn } from '@/lib/utils';
import { ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { SignupOrLogin } from '@/components/SignupOrLogin';
import { ZoomableImage } from '@/components/ZoomableImage';
import { FeatureCarousel } from '@/components/FeatureCarousel';

function CallToActionButtons() {
  const { userId } = auth();
  return (
    <>
      {/* <ChatPanel>
        <div className={cn(buttonVariants({ variant: 'outline' }), 'hidden md:block border-primary w-full font-mono rounded-lg')}>
          <div className="flex flex-row items-center gap-2">
            <Image src="/images/podverse-logo.svg" alt="Podverse" width={30} height={30} />
            AI Chat
          </div>
        </div>
      </ChatPanel> */}
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
          <Link href="/about" className={cn('text-center font-mono', buttonVariants({ variant: 'secondary' }))}>
            See all features
          </Link>
        </>
      )}
    </>
  );
}

function DesktopHeroImage({ width, height }: { width?: number; height?: number }) {
  return (
    <ZoomableImage
      src="/images/podverse-episode-screenshot.png"
      alt="Podverse Episode Screenshot"
      width={width || 700}
      height={height || 700}
    >
      <div className="mx-auto flex w-3/5 flex-col gap-2">
        <div className="font-mono text-base">Podverse supercharges your podcast with AI.</div>
        <div className="mx-auto flex flex-col items-center gap-2 md:flex-row">
          <CallToActionButtons />
        </div>
      </div>
    </ZoomableImage>
  );
}

/** This is the main home screen component, with a feature carousel and featured episodes and podcasts. */
export async function Home() {
  return (
    <section className="container grid w-full items-center gap-6 p-4 pb-8 pt-6 md:p-4 md:py-10">
      <div className="flex w-full flex-col gap-4">
        <h1 className="mt-4 text-pretty font-mono text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          AI superpowers for your podcast.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-[700px] text-pretty font-mono text-base md:text-lg">
          Automatic episode transcripts, summaries, AI chat, and more. Take your podcast to the next level.
        </p>
        <div className="mt-4 flex flex-col gap-2 px-0 md:flex-row md:gap-4">
          <CallToActionButtons />
        </div>
        <div className="mt-4 w-full">
          <FeatureCarousel />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="font-mono text-base sm:text-xl">Latest featured episodes</div>
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
