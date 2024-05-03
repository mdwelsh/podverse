'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';

export function ZoomableImage({
  src,
  alt,
  width,
  height,
  children,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  children?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger>
        <div className="relative size-full">
        <Image className="mx-auto rounded-3xl" src={src} alt={alt} width={width || 400} height={height || 400} />
        <MagnifyingGlassPlusIcon className="absolute left-2 bottom-2 size-5" />
        </div>
      </DialogTrigger>
      <DialogContent className="h-[90%] w-full max-w-[90%] overflow-y-scroll">
        <Image src={src} alt={alt} width={1000} height={1000} className="m-auto" />
        <div className="text-muted-foreground text-center text-sm">
        {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
