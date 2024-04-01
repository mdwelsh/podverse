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
    <div className="flex flex-row gap-10 items-center">
      <Link href="/" className="flex items-center">
        <div className="relative group cursor-pointer">
          <div className="z-5 absolute -inset-1 bg-gradient-to-tr from-primary to-primary rounded-full blur opacity-35 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
          <Image src="/images/podverse-logo.svg" alt="Podverse" width={50} height={50} className="relative z-10" />
        </div>
        <span className="font-mono inline-block font-bold text-2xl text-primary ml-4">Podverse</span>
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
                      'flex items-center text-sm font-medium text-muted-foreground',
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
