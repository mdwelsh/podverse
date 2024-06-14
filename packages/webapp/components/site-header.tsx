import { siteConfig } from '@/config/site';
import { MainNav } from '@/components/main-nav';
import { SignupOrLogin } from '@/components/SignupOrLogin';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SearchPanel } from '@/components/SearchPanel';
import { ChatContextProvider } from './ChatContext';

export function SiteHeader() {
  const { userId } = auth();

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center space-x-0 px-2 sm:h-24 sm:justify-between sm:space-x-0 sm:px-2 md:space-x-4 md:px-4">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ChatContextProvider>
            <SearchPanel />
          </ChatContextProvider>
          <div className="flex items-center space-x-1">
            {userId && (
              <Link href="/dashboard" className="mx-4">
                <Button variant="secondary">Dashboard</Button>
              </Link>
            )}
            <SignupOrLogin />
          </div>
        </div>
      </div>
    </header>
  );
}
