// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
import { getSupabaseClient } from '@/lib/supabase';
import { ManageEpisode } from '@/components/ManageEpisode';
import { Metadata, ResolvingMetadata } from 'next';
import { GetEpisodeWithPodcastBySlug } from 'podverse-utils';

type Props = {
  params: { podcastSlug: string; episodeSlug: string };
  searchParams: { [key: string]: string };
};

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const supabase = await getSupabaseClient();
  const episode = await GetEpisodeWithPodcastBySlug(supabase, params.podcastSlug, params.episodeSlug);
  return {
    title: 'Manage ' + episode.title,
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { podcastSlug: string; episodeSlug: string };
  searchParams: { [key: string]: string };
}) {
  return <ManageEpisode podcastSlug={params.podcastSlug} episodeSlug={params.episodeSlug} />;
}
