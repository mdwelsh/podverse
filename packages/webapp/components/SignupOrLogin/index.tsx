import { auth } from '@clerk/nextjs/server';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';

/** Create a new Users table record, if needed, for the currently logged-in user. */
async function createUser() {
  const { userId, getToken } = auth();
  if (!userId) {
    return;
  }
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('Users').upsert({}).eq('id', userId).select('*');
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

export async function SignupOrLogin() {
  await createUser();
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <div className="text-black font-mono text-sm p-3 bg-primary border rounded-lg">Sign in</div>
        </SignInButton>
      </SignedOut>
    </>
  );
}
