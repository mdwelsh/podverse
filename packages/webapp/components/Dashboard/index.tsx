import { auth } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';
import { Podcast, PodcastWithEpisodes } from 'podverse-utils';
import { NewPodcastDialog } from '@/components/NewPodcastDialog';
import { SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ManagePodcastDialog } from '@/components/ManagePodcastDialog';
import { buttonVariants } from '@/components/ui/button';

async function PodcastStrip({ podcast, supabase }: { podcast: PodcastWithEpisodes; supabase: SupabaseClient }) {
  return (
    <div className="flex w-full flex-row gap-4 overflow-hidden rounded-lg border bg-gray-700 p-4 font-mono text-white dark:bg-gray-700 dark:text-white">
      <div className="flex size-full flex-row gap-4">
        <div className="w-1/5">{podcast.imageUrl && <img src={podcast.imageUrl} />}</div>
        <div className="line-clamp-3 flex w-4/5 flex-col gap-4 truncate text-wrap">
          <div className="text-sm">{podcast.title}</div>
          <div className="text-muted-foreground text-xs">{podcast.Episodes.length} episodes</div>
          <div className="flex flex-row gap-2">
            <ManagePodcastDialog podcast={podcast} />
            <Link className={buttonVariants({ variant: "secondary" })} href={`/podcast/${podcast.slug}`}>View</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function Dashboard() {
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  const supabase = await getSupabaseClient();
  const { data: podcasts, error } = await supabase
    .from('Podcasts')
    .select('*, Episodes(*)')
    .filter('owner', 'eq', userId);
  if (error) {
    console.log('error', error);
    throw error;
  }
  return (
    <div className="mx-auto mt-8 w-2/5 flex flex-col gap-4">
      <div className="w-full flex flex-row justify-between">
        <div className="font-mono text-primary text-lg">Your podcasts</div>
        <NewPodcastDialog />
      </div>
      <div className="w-full flex flex-col p-2 gap-2 text-xs overflow-y-auto h-full">
        {podcasts.map((podcast, index) => (
          <PodcastStrip key={index} podcast={podcast} supabase={supabase} />
        ))}
      </div>
    </div>
  );
}
