'use client';

import { buttonVariants } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import Image from 'next/image';
import { ChatContextProvider } from '../ChatContext';
import { ContextAwareChat } from '@/components/Chat';
import { usePathname } from 'next/navigation';

const DEFAULT_SUGGESTED_QUERIES = [
  'What are some good science podcasts?',
  'Are there any episodes about music?',
  'Report a bug',
];

export function ChatPanel({ children, suggestedQueries }: { children: React.ReactNode; suggestedQueries?: string[] }) {
  const queries = suggestedQueries || DEFAULT_SUGGESTED_QUERIES;

  return (
    <Drawer>
      <DrawerTrigger>{children}</DrawerTrigger>
      <DrawerContent className="mx-auto size-full md:w-4/5">
        <DrawerHeader>
          <DrawerTitle className="text-primary mx-auto font-mono">Podverse AI Chat</DrawerTitle>
        </DrawerHeader>
        <div className="mx-auto w-full overflow-scroll md:w-3/5">
          <ChatContextProvider>
            <ContextAwareChat />
          </ChatContextProvider>
        </div>
        <DrawerFooter>
          <DrawerClose>
            <div className={buttonVariants({ variant: 'outline' })}>Close chat</div>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function FloatingChatPanel() {
  const pathname = usePathname();

  let divClass = 'fixed right-4 bottom-4';
  if (pathname.startsWith('/podcast')) {
    divClass = 'lg:hidden fixed right-4 bottom-4';
  }

  return (
    <ChatPanel>
      <div className={divClass}>
        <div className="group relative inline-flex cursor-pointer">
          <div className="z-5 from-primary to-primary absolute -inset-1 rounded-full bg-gradient-to-tr opacity-25 blur transition duration-1000 group-hover:opacity-80 group-hover:duration-200"></div>
          <div
            role="button"
            className="bg-muted border-primary h-18 z-10 flex flex-row items-center gap-2 rounded-full border p-4 font-mono"
          >
            <Image src="/images/podverse-logo.svg" alt="Podverse" width={40} height={40} />
            AI Chat
          </div>
        </div>
      </div>
    </ChatPanel>
  );
}
