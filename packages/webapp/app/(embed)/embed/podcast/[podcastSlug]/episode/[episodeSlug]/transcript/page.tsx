// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
import { getSupabaseClient } from '@/lib/supabase';
import { Metadata, ResolvingMetadata } from 'next';
import { GetEpisodeWithPodcastBySlug } from 'podverse-utils';
import { EpisodeTranscript } from '@/components/EpisodeTranscript';

type Props = {
  params: { podcastSlug: string; episodeSlug: string };
  searchParams: { [key: string]: string };
};

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const supabase = await getSupabaseClient();
  const episode = await GetEpisodeWithPodcastBySlug(supabase, params.podcastSlug, params.episodeSlug);
  return {
    title: episode.title,
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { podcastSlug: string; episodeSlug: string };
  searchParams: { [key: string]: string };
}) {
  const supabase = await getSupabaseClient();
  const episode = await GetEpisodeWithPodcastBySlug(supabase, params.podcastSlug, params.episodeSlug);
  return <EpisodeTranscript episode={episode} embed />;
}
