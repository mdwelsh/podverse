import { EpisodeDetail } from '@/components/EpisodeDetail';

// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { podcastSlug: string; episodeSlug: string } }) {
  return <EpisodeDetail podcastSlug={params.podcastSlug} episodeSlug={params.episodeSlug} />;
}
