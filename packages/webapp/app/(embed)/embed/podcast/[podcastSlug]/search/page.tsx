// Disable fetch caching for this route.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
import { getSupabaseClient } from '@/lib/supabase';
import { Metadata, ResolvingMetadata } from 'next';
import { GetPodcast } from 'podverse-utils';
import { SearchBox } from '@/components/SearchPanel';
import { ChatContextProvider } from '@/components/ChatContext';
import { PoweredBy } from '@/components/PoweredBy';

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
    <ChatContextProvider>
      <div className="flex flex-col gap-1">
        <SearchBox showCancel={false} />
        <div className="mx-auto">
          <PoweredBy />
        </div>
      </div>
    </ChatContextProvider>
  );
}
