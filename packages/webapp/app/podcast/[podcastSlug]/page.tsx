// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import { PodcastDetail } from '@/components/PodcastDetail';

export default async function Page({ params }: { params: { podcastSlug: string } }) {
  return <PodcastDetail podcastSlug={params.podcastSlug} />;
}
