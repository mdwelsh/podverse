// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import { EpisodeDetail } from '@/components/EpisodeDetail';

export default async function Page({ params }: { params: { podcastSlug: string; episodeSlug: string } }) {
  return <EpisodeDetail podcastSlug={params.podcastSlug} episodeSlug={params.episodeSlug} />;
}
