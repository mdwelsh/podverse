import { DeletePodcast } from 'podverse-utils';
import { auth } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';

/** Delete the given podcast. */
export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  console.log(`Got DELETE for podcast ${params.slug}`);
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabase = await getSupabaseClient();
  await DeletePodcast(supabase, params.slug);
  return new Response(`Deleted podcast ${params.slug}`, { status: 200 });
}
