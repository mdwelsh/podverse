'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ZoomableImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    <Dialog>
      <DialogTrigger>
        <Image className="mx-auto rounded-3xl" src={src} alt={alt} width={width || 400} height={height || 400} />
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90%] max-h-[90%] overflow-y-scroll">
        <Image src={src} alt={alt} width={1000} height={1000} />
      </DialogContent>
    </Dialog>
  );
}
