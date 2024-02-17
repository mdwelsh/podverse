
import { auth } from '@clerk/nextjs';

export function Owner({ children, owner }: { children: React.ReactNode; owner: string | null }) {
  const { userId } = auth();
  console.log('userId', userId);
  console.log('owner', owner);
  if (!userId) {
    return null;
  }
  return (userId && userId === owner) ? children : null;
}