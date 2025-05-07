import type { Metadata } from 'next';
import { metadata as metadataConfig } from './metadata';

export const metadata: Metadata = {
  ...metadataConfig,
  manifest: '/manifest.webmanifest',
  icons: {
    apple: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
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
