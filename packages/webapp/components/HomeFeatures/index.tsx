import Link from 'next/link';
import { ZoomableImage } from '@/components/ZoomableImage';
import { auth } from '@clerk/nextjs/server';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignupOrLogin } from '@/components/SignupOrLogin';
import { PodcastCarousel } from '../PodcastCarousel';

function Feature({ heading, image, children }: { heading: string; image?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="font-mono text-2xl">{heading}</div>
      <div className="text-muted-foreground text-base">{children}</div>
      {image && (
        <div className="mx-auto">
          <ZoomableImage src={image} alt={heading} width={600} height={600}>
            <div className="text-primary font-mono text-lg">{heading}</div>
            {children}
          </ZoomableImage>
        </div>
      )}
    </div>
  );
}

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

export async function HomeFeatures() {
  return (
    <section className="container mx-auto grid w-11/12 items-center gap-6 p-4 pb-8 pt-6 md:p-4 md:py-10">
      <div className="flex w-full flex-col gap-4">
        <h1 className="mt-4 text-pretty font-mono text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          AI superpowers for your podcast.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-[700px] text-pretty font-mono text-base md:text-lg">
          Automatic episode transcripts, summaries, AI chat, and more. Take your podcast to the next level.
        </p>
        <div className="mx-auto mt-4 flex flex-col gap-2 px-0 md:flex-row">
          <CallToActionButtons />
        </div>

        <div className="mx-auto mt-2">
          <ZoomableImage
            src="/images/podverse-episode-screenshot.png"
            alt="Podverse episode screenshot"
            width={600}
            height={600}
          >
            The Podverse episode page, with transcript, summary, and AI chat.
          </ZoomableImage>
        </div>
        <div className="w-full mx-auto">
          <div className="font-mono text-lg text-center text-primary p-4">Explore podcasts on Podverse</div>
          <PodcastCarousel />
        </div>
        <div className="mx-auto mt-6 w-full md:w-4/5">
          <Feature heading="Automatic episode transcripts" image="/images/podverse-transcript-screenshot.png">
            Podverse generates text transcripts of each episode, and automatically identify the names of each speaker in
            the audio. Transcripts are synchronized with audio playback.
          </Feature>

          <Feature heading="Embedded on your site" image="/images/podverse-embed-screenshot.png">
            AI features are fully embedded on your site -- search, chat, and transcripts. Customize the look and feel to
            match your site.
          </Feature>

          <Feature heading="AI-generated episode summaries" image="/images/podverse-summary-screenshot.png">
            Podverse uses the latest AI models to read the transcript and come up with a short, pithy summary to make it
            easier for listeners to learn more about your podcast.
          </Feature>

          <Feature heading="AI-powered chat" image="/images/podverse-chat-screenshot.png">
            Podverse builds an AI chatbot that knows everything about your podcast and the content of every episode,
            helping listeners dig deeper by asking questions and getting more information about your content. It&apos;s
            just like ChatGPT, but for your podcast.
          </Feature>

          <Feature heading="Full-text search" image="/images/podverse-search-screenshot.png">
            Your podcast is fully indexed and searchable, so listeners can find exactly what they&apos;re looking for.
          </Feature>
        </div>
        <div className="mx-auto mt-4 flex flex-col gap-2 px-0 md:flex-row">
          <CallToActionButtons />
        </div>
      </div>
    </section>
  );
}
