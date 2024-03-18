import { auth } from '@clerk/nextjs';
import { GetUsage } from '@/lib/plans';
import { getSupabaseClient } from '@/lib/supabase';

/** Return usage for the current user. */
export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabase = await getSupabaseClient();
  const usage = await GetUsage(supabase, userId);
  return Response.json(usage);
}
