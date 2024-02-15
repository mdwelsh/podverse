import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export function SignupOrLogin() {
  return (
    <Link href="/signup" target="_blank" rel="noreferrer" className={buttonVariants()}>
      Login
    </Link>
  );
}
