import '@/styles/globals.css';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { fontSans } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { GoogleAnalytics } from '@next/third-parties/google';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <ClerkProvider
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#f59e0b',
            colorText: 'white',
            colorBackground: 'hsl(12, 6.5%, 15.1%)',
            colorTextOnPrimaryBackground: 'white',
            colorTextSecondary: 'white',
            colorNeutral: 'white',
          },
        }}
      >
        <html lang="en" suppressHydrationWarning>
          <head>
            <base target="_parent" />
          </head>
          <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
            <ThemeProvider attribute="class" enableSystem enableColorScheme>
              <div className="relative flex min-h-screen flex-col w-full">
                <>
                  <div className="flex-1">{children}</div>
                </>
              </div>
              <TailwindIndicator />
            </ThemeProvider>
            <Analytics />
          </body>
          <GoogleAnalytics gaId="G-F7EJYK1JLV" />
        </html>
        <SpeedInsights />
      </ClerkProvider>
    </>
  );
}
