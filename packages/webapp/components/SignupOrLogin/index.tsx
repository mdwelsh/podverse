import { auth } from '@clerk/nextjs/server';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

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

export async function SignupOrLogin({ text }: { text?: string }) {
  await createUser();
  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <Button variant="default" className="font-mono">
            {text || 'Sign in'}
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
