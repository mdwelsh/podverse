'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSearchParams } from 'next/navigation';
//import { Button } from '@/components/ui/button';
//import Image from 'next/image';

export function PurchaseConfirmation() {
  const params = useSearchParams();
  if (params.get('success') === 'true') {
    return <div className="w-full mb-12 bg-sky-800 p-4 border-white border font-mono">🎉 Thanks for subscribing!</div>;
  } else if (params.get('canceled') === 'true') {
    return (
      <div className="w-full mb-12 bg-destructive p-4 border-white border font-mono">Your purchase was canceled.</div>
    );
  } else {
    return null;
  }
}
