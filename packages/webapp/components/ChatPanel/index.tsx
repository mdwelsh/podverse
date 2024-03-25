'use client';

import { CreateMessage } from 'ai';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import Image from 'next/image';
import { Chat } from '@/components/Chat';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ChatPanel({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (_: boolean) => void;
  children: React.ReactNode;
}) {
  const suggestedQueries: string[] = [
    'What are some good science podcasts?',
    'Are there any episodes about music?',
    'What does this website do, anyway?',
  ];
  const initialMessages: CreateMessage[] = [
    {
      content: `Hi there! I\'m the Podverse AI Bot. You can ask me questions about any of the podcasts on this site.`,
      role: 'assistant',
    },
    {
      content:
        'Here are some suggestions to get you started:\n' + suggestedQueries.map((s) => `[${s}](/?suggest)`).join(' '),
      role: 'assistant',
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger>{children}</DrawerTrigger>
      <DrawerContent className="h-full w-full md:w-4/5 mx-auto">
        <DrawerHeader>
          <DrawerTitle className="font-mono text-primary mx-auto">Podverse AI Chat</DrawerTitle>
        </DrawerHeader>
        <div className="mx-auto w-full md:w-3/5 overflow-scroll">
          <Chat initialMessages={initialMessages.map((m, i) => ({ ...m, id: i.toString() }))} />
        </div>
        <DrawerFooter>
          <DrawerClose>
            <Button variant="outline" className="text-primary">Close chat</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function FloatingChatPanel() {
  const pathname = usePathname();

  let divClass = "fixed right-4 bottom-4";
  if (pathname.startsWith('/podcast')) {
    divClass = "lg:hidden fixed right-4 bottom-4";
  }

  return (
    <ChatPanel>
      <div className={divClass}>
        <div className="relative inline-flex group cursor-pointer">
          <div className="z-5 absolute -inset-1 bg-gradient-to-tr from-primary to-primary rounded-full blur opacity-25 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
          <div
            role="button"
            className="z-10 bg-muted flex flex-row font-mono items-center gap-2 p-4 rounded-full border border-primary h-18"
          >
            <Image src="/images/podverse-logo.svg" alt="Podverse" width={40} height={40} />
            AI Chat
          </div>
        </div>
      </div>
    </ChatPanel>
  );
}
