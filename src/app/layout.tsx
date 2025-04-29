import ClientProviders from '@/components/client-providers';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ContentSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { metadata as metadataConfig } from './metadata';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  ...metadataConfig,
  manifest: '/manifest.webmanifest',
  icons: {
    apple: [
      {
        url: '/images/icons/icon-180x180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      {
        url: '/images/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/images/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: metadataConfig.title as string,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/images/icons/icon-180x180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn('min-h-screen font-sans antialiased', inter.variable)}
      >
        <ErrorBoundary>
          <ClientProviders>
            <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
