import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

/** Return a Supabase client that is authenticated using the given token. */
export async function getSupabaseClientWithToken(token: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_API_KEY as string, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Return a Supabase client that is authenticated using the Clerk JWT. */
export async function getSupabaseClient() {
  const { getToken } = auth();
  try {
    const supabaseAccessToken = await getToken({ template: 'podverse-supabase' });
    if (!supabaseAccessToken) {
      throw new Error('No Supabase access token');
    }
    return getSupabaseClientWithToken(supabaseAccessToken);
  } catch (error) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    );
  }
}

/**
 * Returns a Supabase client for the Supabase Service Role, which can bypass RLS.
 * This should only be used in places where we don't have a user access token, or the user
 * is not otherwise authenticated - such as background processing tasks.
 */
export async function getAdminSupabaseClient() {
  console.warn('Creating admin Supabase client');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
}
