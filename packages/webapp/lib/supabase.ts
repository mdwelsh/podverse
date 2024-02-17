import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

/** TODO(mdw): Replace the following with getSupabaseClient() everywhere. */
export default createClient(
  //process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  //process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,

  // We need to use the non-anonymous key to allow writes by the process API endpoints.
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_API_KEY as string
);

/** Return a Supabase client that is authenticated using the Clerk JWT. */
export async function getSupabaseClient() {
  const { getToken } = auth();
  const supabaseAccessToken = await getToken({ template: 'podverse-supabase' });
  if (!supabaseAccessToken) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  } else {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_API_KEY as string,
      {
        global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` }}
      }
    );
  }
};
