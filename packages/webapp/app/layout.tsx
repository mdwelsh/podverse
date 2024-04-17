import '@/styles/globals.css';
import { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { siteConfig } from '@/config/site';
import { fontSans } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { SiteHeader } from '@/components/site-header';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { ThemeProvider } from '@/components/theme-provider';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import { FloatingChatPanel } from '@/components/ChatPanel';
import { dark } from '@clerk/themes';
import { Analytics } from '@vercel/analytics/react';
import { ChatContextProvider } from '@/components/ChatContext';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
  // For now, restrict usage on production.
  let comingSoon = false;
  // if (process.env.VERCEL_ENV === 'production') {
  //   const user = await currentUser();
  //   // This is the mdwelsh Github user.
  //   if (user?.id !== 'user_2cQ3Uw3DLjz7B8AhRs0winNCAad') {
  //     comingSoon = true;
  //   }
  // }

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
          <head />
          <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
            <ThemeProvider attribute="class" forcedTheme="dark" defaultTheme="dark">
              <div className="relative flex min-h-screen flex-col w-full">
                {comingSoon ? (
                  'Coming soon'
                ) : (
                  <>
                    <SiteHeader />
                    <div className="flex-1">{children}</div>
                    <ChatContextProvider>
                      <FloatingChatPanel />
                    </ChatContextProvider>
                    <Footer />
                    <Toaster richColors />
                  </>
                )}
              </div>
              <TailwindIndicator />
            </ThemeProvider>
            <Analytics />
          </body>
        </html>
      </ClerkProvider>
      <SpeedInsights />
    </>
  );
}
