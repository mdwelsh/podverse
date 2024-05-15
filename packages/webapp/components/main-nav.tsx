import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NavItem } from '@/types/nav';
import { cn } from '@/lib/utils';
import { ClientNavMenu } from '@/components/ClientNavMenu';

interface MainNavProps {
  items?: NavItem[];
}

export function MainNav({ items }: MainNavProps) {
  return (
    <div className="flex flex-row items-center gap-0 md:gap-10">
      <Link href="/" className="flex items-center">
        <div className="group relative hidden cursor-pointer sm:inline mr-4">
          <div className="z-5 from-primary to-primary absolute -inset-1 rounded-full bg-gradient-to-tr opacity-35 blur transition duration-1000 group-hover:opacity-80 group-hover:duration-200"></div>
          <Image src="/images/podverse-logo.svg" alt="Podverse" width={50} height={50} className="relative z-10" />
        </div>
        <span className="text-primary inline-block font-mono text-2xl font-bold">Podverse</span>
      </Link>
      <div className="hidden md:block">
        {items?.length ? (
          <nav className="flex gap-6 font-mono">
            {items?.map(
              (item, index) =>
                item.href && (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      'text-muted-foreground flex items-center text-sm font-medium',
                      item.disabled && 'cursor-not-allowed opacity-80',
                    )}
                  >
                    {item.title}
                  </Link>
                ),
            )}
          </nav>
        ) : null}
      </div>
      <div className="block md:hidden">
        <ClientNavMenu items={items} />
      </div>
    </div>
  );
}
