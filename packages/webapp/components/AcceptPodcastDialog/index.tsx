'use client';

import { useState } from 'react';
import { Podcast, PodcastWithEpisodes, isReady } from 'podverse-utils';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { refreshPodcast, updatePodcast } from '@/lib/actions';
import { EpisodeLimit } from '@/lib/limits';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { auth } from '@clerk/nextjs/server';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export function ActivateButton({ text }: { text?: string }) {
  return (
    <Button variant="default" className="font-mono">
      {text || 'Claim podcast'}
    </Button>
  );
}

export function SignUpOrActivateButton({ text, uuid }: { text?: string; uuid: string }) {
  const redirectUrl = 'https://podverse.ai/activate?uuid=' + uuid.replace(/-/g, '');
  return (
    <>
      <SignedIn>
        <ActivateButton text={text} />
      </SignedIn>
      <SignedOut>
        <SignInButton redirectUrl={redirectUrl}>
          <Button variant="default" className="font-mono">
            {text || 'Create account'}
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
}

export function AcceptPodcastDialog({ podcast }: { podcast: PodcastWithEpisodes }) {
  if (!podcast.uuid) {
    throw new Error('Podcast UUID not found');
  }
  return (
    <Dialog>
      <DialogTrigger>
        <div className={cn(buttonVariants({ variant: 'default' }))}>Activate free account</div>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono">Activate your Podverse account</DialogTitle>
        </DialogHeader>
        <div>
          <div className="text-muted-foreground flex flex-col gap-4 font-mono text-sm">
            <div>You are about to activate your Podverse account and claim your one-year free subscription.</div>
            <div>
              Click the <b className="text-primary">Activate account</b> button below to sign in.
            </div>
            <div>
              Your podcast <b className="text-primary">{podcast.title}</b> will then be owned by your account, where you
              can publish it, import more episodes, and more.
            </div>
            <div>
              Any questions? Just email us at{' '}
              <a className="text-primary font-mono underline" href="mailto:matt@ziggylabs.ai">
                matt@ziggylabs.ai
              </a>
              . Thanks!
            </div>
          </div>
        </div>
        <DialogFooter>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <DialogClose>
                <SignUpOrActivateButton uuid={podcast.uuid} />
              </DialogClose>
              <DialogClose>
                <Button className="font-mono" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
