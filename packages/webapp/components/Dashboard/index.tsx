import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase';
import { NewPodcastDialog } from '@/components/NewPodcastDialog';
import { PodcastStrip } from '@/components/PodcastStrip';

export async function Dashboard() {
  const { userId, protect } = auth();
  protect();
  console.log(`MDW: AUTH ON DASHBOARD IS: ${userId}`);

  if (!userId) {
    return null;
  }
  const supabase = await getSupabaseClient();
  const { data: podcasts, error } = await supabase
    .from('Podcasts')
    .select('*, Episodes(*)')
    .filter('owner', 'eq', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.log('error', error);
    throw error;
  }
  return (
    <div className="mx-auto mt-8 w-3/5 flex flex-col gap-4">
      <div className="w-full flex flex-row justify-between">
        <div className="font-mono text-primary text-lg">Your podcasts</div>
        <NewPodcastDialog />
      </div>
      <div className="w-full flex flex-col p-2 gap-2 text-xs overflow-y-auto h-full">
        {podcasts.map((podcast, index) => (
          <PodcastStrip key={index} podcast={podcast} manageable />
        ))}
      </div>
    </div>
  );
}
