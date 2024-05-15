'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ZoomableImage } from '@/components/ZoomableImage';

function FeatureCard({ heading, image, children }: { heading: string; image: string; children: React.ReactNode }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-1">
      <div className="mx-auto rounded-lg border border-[#684c1c] p-4">
        <ZoomableImage src={image} alt={heading} width={800} height={800}>
          <div className="text-primary font-mono text-lg">{heading}</div>
          {children}
        </ZoomableImage>
      </div>
      <div className="font-mono text-sm">{heading}</div>
    </div>
  );
}

const features = [
  <FeatureCard heading="ChatGPT for your podcast" image="/images/screenshot-episode.png">
    Bring your podcast into the AI area with Podverse.
  </FeatureCard>,
  <FeatureCard heading="Podcast details page" image="/images/screenshot-podcast.png">
    Bring your podcast into the AI area with Podverse.
  </FeatureCard>,
  <FeatureCard heading="Automatic episode transcripts" image="/images/screenshot-transcript.png">
    Podverse generates text transcripts of each episode, and automatically identify the names of each speaker in the
    audio. Transcripts are synchronized with audio playback.
  </FeatureCard>,
  <FeatureCard heading="AI-generated episode summaries" image="/images/screenshot-summary.png">
    Podverse uses the latest AI models to read the transcript and come up with a short, pithy summary to make it easier
    for listeners to learn more about your podcast.
  </FeatureCard>,
  <FeatureCard heading="AI-powered chat and Q&A" image="/images/screenshot-chat.png">
    Podverse builds an AI chatbot that knows everything about your podcast and the content of every episode, helping
    listeners dig deeper by asking questions and getting more information about your content. It&apos;s just like
    ChatGPT, but for your podcast.
  </FeatureCard>,
  <FeatureCard heading="Full-text search" image="/images/screenshot-search.png">
    Your podcast is fully indexed and searchable, so listeners can find exactly what they&apos;re looking for.
  </FeatureCard>,
];

export function FeatureCarousel() {
  return (
    <div className="group relative mx-auto w-full sm:w-9/12 md:max-w-2xl lg:max-w-2xl">
      <Carousel
        opts={{
          align: 'center',
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2 w-full md:-ml-8">
          {features.map((feature, index) => (
            <CarouselItem className="basis-9/12 pl-2 md:basis-9/12 md:pl-8" key={index}>
              {feature}
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden sm:block">
          <CarouselPrevious variant="secondary" />
        </div>
        <div className="hidden sm:block">
          <CarouselNext variant="secondary" />
        </div>
      </Carousel>
      <div className="z-5 pointer-events-none absolute inset-0 flex w-full flex-row gap-0">
        <div className="from-background w-1/2 bg-gradient-to-r from-0% to-transparent to-10% opacity-100" />
        <div className="to-background w-1/2 bg-gradient-to-r from-transparent from-90% to-100% opacity-100" />
      </div>
    </div>
  );
}
