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

export function ChatDialog() {
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
    <Drawer>
      <DrawerTrigger>
        <Button variant="outline" className="border-primary font-mono">
          <div className="flex flex-row items-center gap-2">
            <Image src="/images/podverse-logo.svg" alt="Podverse" width={30} height={30} />
            AI Chat
          </div>
        </Button>
      </DrawerTrigger>
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
