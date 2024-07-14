// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
import { getSupabaseClient } from '@/lib/supabase';
import { PodcastDetail } from '@/components/PodcastDetail';
import { Metadata, ResolvingMetadata } from 'next';
import { GetPodcast } from 'podverse-utils';

type Props = {
  params: { podcastSlug: string };
  searchParams: { [key: string]: string };
};

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const supabase = await getSupabaseClient();
  const podcast = await GetPodcast(supabase, params.podcastSlug);
  return {
    title: podcast.title,
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { podcastSlug: string };
  searchParams: { [key: string]: string };
}) {
  return (
    <PodcastDetail
      podcastSlug={params.podcastSlug}
      uuid={searchParams['uuid']}
      activationCode={searchParams['activationCode']}
      header={(searchParams['showHeader'] || 'false') === 'true'}
      embed={true}
      entriesPerPage={(searchParams['entriesPerPage'] && parseInt(searchParams['entriesPerPage'])) || 10}
    />
  );
}
