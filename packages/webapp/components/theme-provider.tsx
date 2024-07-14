'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { useSearchParams } from 'next/navigation';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme') || 'dark';

  // We allow embeds to set the theme colors via query params.
  useEffect(() => {
    if (searchParams.has('bgColor')) {
      document.documentElement.style.setProperty('--background', searchParams.get('bgColor'));
    }
    if (searchParams.has('fgColor')) {
      document.documentElement.style.setProperty('--foreground', searchParams.get('fgColor'));
    }
    if (searchParams.has('highlightColor')) {
      document.documentElement.style.setProperty('--primary', searchParams.get('highlightColor'));
    }
  }, [searchParams, theme]);

  return (
    <NextThemesProvider {...props} forcedTheme={theme} defaultTheme={theme}>
      {children}
    </NextThemesProvider>
  );
}
