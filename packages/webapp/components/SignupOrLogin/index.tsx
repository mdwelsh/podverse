import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export function SignupOrLogin() {
  return (
    <>
      <SignedIn>
        {/* Mount the UserButton component */}
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        {/* Signed out users get sign in button */}
        <SignInButton className="text-black text-sm p-3 bg-primary border rounded-lg" />
      </SignedOut>
    </>
  );
}
