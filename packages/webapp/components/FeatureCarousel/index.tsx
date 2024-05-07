'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ZoomableImage } from '@/components/ZoomableImage';

function FeatureCard({ heading, image, children }: { heading: string; image: string; children: React.ReactNode }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-4">
      <div className="mx-auto">
        <ZoomableImage src={image} alt={heading} width={800} height={800}>
          <div className="text-primary font-mono text-lg">{heading}</div>
          {children}
        </ZoomableImage>
      </div>
    </div>
  );
}

const features = [
  <FeatureCard heading="Podverse episode view" image="/images/screenshot-episode.png">
    Bring your podcast into the AI area with Podverse.
  </FeatureCard>,
  <FeatureCard heading="Podverse episode view" image="/images/screenshot-podcast.png">
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
  <FeatureCard heading="AI-powered chat" image="/images/screenshot-chat.png">
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
    <Carousel className="mx-auto w-10/12 md:max-w-lg lg:max-w-2xl" opts={{
      align: "center",
      loop: true,
    }}>
      <CarouselContent className="-ml-2 md:-ml-8 w-full">
        {features.map((feature, index) => (
          <CarouselItem className="basis-11/12 md:basis-9/12 pl-2 md:pl-8" key={index}>
            {feature}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious variant="ghost" />
      <CarouselNext variant="ghost" />
    </Carousel>
  );
}
