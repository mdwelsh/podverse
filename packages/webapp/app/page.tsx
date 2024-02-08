"use server";

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { EpisodeList } from "@/components/EpisodeList"
import { PodcastList } from "@/components/PodcastList"

// Use dynamic rendering, since we fetch live data.
//export const dynamicParams = true;
//export const revalidate = 60;

export default async function HomePage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          AI superpowers for your podcast.
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Automatic episode transcripts, summaries, AI chat, and more.<br />
          Take your podcast to the next level.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/signup"
          target="_blank"
          rel="noreferrer"
          className={buttonVariants()}
        >
          Sign up now
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href="/learn-more"
          className={buttonVariants({ variant: "outline" })}
        >
          Learn more
        </Link>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="text-xl">Latest episodes</div>
        <EpisodeList />
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="text-xl">Explore podcasts</div>
        <PodcastList />
      </div>
    </section>
  )
}
