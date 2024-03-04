
import { auth } from '@clerk/nextjs';

export function Owner({ children, owner }: { children: React.ReactNode; owner: string | null }) {
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  return (userId && userId === owner) ? children : null;
}