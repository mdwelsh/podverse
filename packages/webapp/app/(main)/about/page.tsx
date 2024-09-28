import Image from 'next/image';
import Link from 'next/link';
import { ZoomableImage } from '@/components/ZoomableImage';
import { FeatureCarousel } from '@/components/FeatureCarousel';

import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(props: any, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: 'Features',
  };
}

function Feature({ heading, image, children }: { heading: string; image?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="text-primary font-mono text-lg">{heading}</div>
      <div className="text-muted-foreground text-base">{children}</div>
      {image && (
        <div className="mx-auto">
          <ZoomableImage src={image} alt={heading} width={600} height={800}>
            <div className="text-primary text-lg font-mono">{heading}</div>
            {children}
          </ZoomableImage>
        </div>
      )}
    </div>
  );
}

export default async function Page() {
  return (
    <>
      <div className="mx-auto mt-8 flex w-11/12 flex-col gap-4 md:w-3/5">
        <div className="font-mono text-3xl">Your podcast is so 2023.</div>
        <div className="text-muted-foreground font-mono text-xl">Bring it into the age of AI with Podverse.</div>
      </div>
      <div className="mt-8 w-full">
        <FeatureCarousel />
      </div>
      <div className="mx-auto mt-8 flex w-11/12 flex-col gap-4 md:w-3/5">
        <div className="text-muted-foreground mt-4">
          Podverse uses AI to help you and your listeners get the most out of your podcast.
        </div>
        <div className="text-muted-foreground mt-4">
          <span className="text-primary">It&apos;s super easy to get started.</span> All you need to do is provide your
          podcast&apos;s RSS feed URL, and we do the rest.
        </div>
        <div className="mt-6 font-mono text-3xl">Packed with features</div>

        <Feature heading="Automatic episode transcripts" image="/images/podverse-transcript-screenshot.png">
          Podverse generates text transcripts of each episode, and automatically identify the names of each speaker in
          the audio. Transcripts are synchronized with audio playback.
        </Feature>

        <Feature heading="AI-generated episode summaries" image="/images/podverse-summary-screenshot.png">
          Podverse uses the latest AI models to read the transcript and come up with a short, pithy summary to make it
          easier for listeners to learn more about your podcast.
        </Feature>

        <Feature heading="Embedded on your site" image="/images/podverse-embed-screenshot.png">
          AI features are fully embedded on your site -- search, chat, and transcripts. Customize the look and feel to
          match your site.
        </Feature>

        <Feature heading="AI-powered chat" image="/images/podverse-chat-screenshot.png">
          Podverse builds an AI chatbot that knows everything about your podcast and the content of every episode,
          helping listeners dig deeper by asking questions and getting more information about your content. It&apos;s
          just like ChatGPT, but for your podcast.
        </Feature>

        <Feature heading="Full-text search" image="/images/podverse-search-screenshot.png">
          Your podcast is fully indexed and searchable, so listeners can find exactly what they&apos;re looking for.
        </Feature>

        <div className="mt-4 font-mono text-3xl">You&apos;re in control.</div>
        <div className="text-muted-foreground mt-4">
          We get it -- <span className="text-primary">AI can be scary for creators</span>. That&apos;s why everything
          Podverse does with your content is fully under your control. We will never use your content to train new
          models or generate new material, and you can remove your podcast from Podverse at any time. Our whole mission
          is to make sure you get the most out of your podcast, not to undercut creators.
        </div>
        <div className="text-muted-foreground mt-4">
          You also have the option of <span className="text-primary">keeping your podcast hidden</span> on the Podverse
          site, requiring users to access it through a private link. Podverse isn&apos;t meant to replace your existing
          distribution channels -- just to augment them. Alternately, you can mark your podcast as{' '}
          <span className="text-primary">discoverable</span>, where it can be found through the Podcast site directly.
        </div>

        <div className="mt-4 font-mono text-3xl">What&apos;s it cost?</div>
        <div className="text-muted-foreground mt-4">
          Podverse is <span className="text-primary">absolutely free to get started</span>. You can import up to 10
          podcast episodes on the free plan. We have more generous plans available for creators who want to fully
          leverage the power of Podverse. Check out our{' '}
          <Link className="underline text-primary" href="/pricing">
            pricing page
          </Link>{' '}
          for more details.
        </div>

        <div className="mt-4 font-mono text-3xl">Who made this thing?</div>
        <div className="text-muted-foreground">
          Podverse is created by{' '}
          <a href="https://ziggylabs.ai" className="text-primary underline">
            Ziggylabs
          </a>
          , a new company building AI-powered tools that help people learn and grow. Ziggylabs is founded by{' '}
          <a href="https://www.mdw.la" className="text-primary underline">
            Matt Welsh
          </a>
          , an AI hacker, former CS prof, and entrepreneur from Seattle.
        </div>
        <div className="text-muted-foreground">
          We built Podverse because we love learning from podcasts, but found that podcast content can be hard to
          discover, hard to reference later, and hard to share with others. Bringing all of the amazing content from
          podcasts into a text-based format makes it easier to search, share, and learn from podcasts.
        </div>
        <div className="text-muted-foreground">
          We&apos;d love to hear from you! If you have feedback, questions, or suggestions on how to make Podverse
          better, drop us a line at{' '}
          <a href="mailto:hello@ziggylabs.ai" className="text-primary underline">
            hello@ziggylabs.ai
          </a>
          .
        </div>
      </div>
    </>
  );
}
