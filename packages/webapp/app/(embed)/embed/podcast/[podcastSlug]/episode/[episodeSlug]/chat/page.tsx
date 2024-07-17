// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import { ChatEmbed } from '@/components/ChatEmbed';

export default async function Page({
  params,
  searchParams,
}: {
  params: { podcastSlug: string; episodeSlug: string };
  searchParams: { [key: string]: string };
}) {
  return <ChatEmbed podcastSlug={params.podcastSlug} episodeSlug={params.episodeSlug} />;
}
