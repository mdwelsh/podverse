'use client';

import { NavItem } from '@/types/nav';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import Link from 'next/link';

export function ClientNavMenu({ items }: { items?: NavItem[] }) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="font-mono">Menu</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="flex flex-col gap-2 w-[250px] bg-muted font-mono p-4">
              {items?.map(
                (item, index) =>
                  item.href && (
                    <NavigationMenuLink key={index}>
                      <Link key={index} href={item.href}>
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  )
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
