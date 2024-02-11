import { EpisodeDetail } from '@/components/EpisodeDetail';

export default async function Page({ params }: { params: { podcastSlug: string; episodeSlug: string } }) {
  return <EpisodeDetail podcastSlug={params.podcastSlug} episodeSlug={params.episodeSlug} />;
}
