import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export function SignupOrLogin() {
  return (
    <>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton className="text-black font-mono text-sm p-3 bg-primary border rounded-lg" />
      </SignedOut>
    </>
  );
}
