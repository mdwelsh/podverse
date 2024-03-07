import { auth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';

/** Create a new Users table record, if needed, for the currently logged-in user. */
async function createUser() {
  const { userId, getToken } = auth();
  if (!userId) {
    return;
  }
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from('Users').upsert({}).eq('id', userId).select('*');
  if (error) {
    throw error;
  }
}

export async function SignupOrLogin() {
  await createUser();
  return (
    <>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <div className="text-black font-mono text-sm p-3 bg-primary border rounded-lg">Sign in</div>
        </SignInButton>
      </SignedOut>
    </>
  );
}
