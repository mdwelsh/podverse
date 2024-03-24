'use client';

import { CreateMessage } from 'ai';
import { Button } from '@/components/ui/button';
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
      <DrawerContent className="h-full w-4/5 mx-auto">
        <DrawerHeader>
          <DrawerTitle className="font-mono text-primary mx-auto">Podverse AI Chat</DrawerTitle>
        </DrawerHeader>
        <div className="mx-auto w-3/5 overflow-scroll">
          <Chat initialMessages={initialMessages.map((m, i) => ({ ...m, id: i.toString() }))} />
        </div>
        <DrawerFooter>
          <DrawerClose>
            <Button variant="outline">Close chat</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function FloatingChatPanel() {
  const pathname = usePathname();

  if (pathname.startsWith('/podcast')) {
    return null;
  }

  return (
    <ChatPanel>
      <div className="fixed right-4 bottom-4 z-30">
        <Button variant="outline" className="bg-muted border-primary rounded-full font-mono h-18">
          <div className="flex flex-row items-center gap-2 p-1">
            <Image src="/images/podverse-logo.svg" alt="Podverse" width={40} height={40} />
            AI Chat
          </div>
        </Button>
      </div>
    </ChatPanel>
  );
}
