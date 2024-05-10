// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import { PodcastDetail } from '@/components/PodcastDetail';
import { search } from '@/lib/actions';

export default async function Page({
  params,
  searchParams,
}: {
  params: { podcastSlug: string };
  searchParams: { [key: string]: string };
}) {
  return <PodcastDetail podcastSlug={params.podcastSlug} uuid={searchParams['uuid']} activationCode={searchParams['activationCode']} />;
}
