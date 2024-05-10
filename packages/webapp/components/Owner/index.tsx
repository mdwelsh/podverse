import { auth } from '@clerk/nextjs/server';

export function Owner({ children, owner }: { children: React.ReactNode; owner: string | null }) {
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  return userId && userId === owner ? children : <div />;
}
