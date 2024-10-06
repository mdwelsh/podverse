'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useEffect, useState } from 'react';
import { getPodcastStats } from '@/lib/actions';
import { PodcastStat } from 'podverse-utils';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';

function PodcastCarouselCard({ podcast }: { podcast: PodcastStat }) {
  return (
    <div className="lex aspect-square flex-col items-center justify-center gap-1">
      <Link className="w-full" href={`/podcast/${podcast.slug}`}>
        <div className="hover:ring-primary w-min-[200px] rounded-lg border-2 border-slate-700 hover:ring-4">
          <div className="h-[70px] bg-gradient-to-b from-white from-50% to-slate-900 to-90% bg-clip-text p-2 text-xs text-transparent md:text-sm">
            {podcast.title}
          </div>
          {podcast.imageUrl && (
            <Image width={400} height={400} src={podcast.imageUrl} alt={`${podcast.slug}`} className="w-full" />
          )}
        </div>
      </Link>
    </div>
  );
}

export function PodcastCarousel() {
  const [podcasts, setPodcasts] = useState<PodcastStat[]>([]);

  useEffect(() => {
    if (podcasts.length > 0) {
      return;
    }
    getPodcastStats().then((p) => setPodcasts(p.filter((podcast) => !podcast.private)));
  }, [podcasts]);

  if (podcasts.length === 0) {
    return (
      <div className="mx-auto w-1/2">
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  return (
    // <div className="group relative mx-auto max-w-md md:max-w-xl lg:max-w-2xl">
    <div className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl">
      <Carousel
        opts={{
          align: 'center',
          loop: true,
        }}
      >
        {/* <CarouselContent className="-ml-2 w-1/2 md:-ml-8"> */}
        <CarouselContent className="w-1/2 py-4">
          {podcasts.map((podcast, index) => (
            <CarouselItem className="basis-9/12 pl-2 md:basis-9/12 md:pl-8" key={index}>
              <PodcastCarouselCard podcast={podcast} />
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
