import { Metadata } from 'next';

const defaultImage = '/default-fallback.svg';

export const metadata: Metadata = {
  title: 'Wesley Quintero - Professional Portfolio',
  description:
    'Data-Driven Amazon & E-commerce Specialist portfolio website.',
  keywords: [
    'Wesley Quintero',
    'Amazon Specialist',
    'Data Analytics',
    'E-commerce',
    'Amazon Seller Tools',
    'Portfolio',
    'Amazon SEO',
    'PPC Optimization',
    'Data Visualization',
    'SellSmart Hub',
    'DevFlowDB',
  ],
  authors: [
    { name: 'Wesley Quintero', url: 'https://github.com/johnwesleyquintero' },
  ],
  creator: 'Wesley Quintero',
  publisher: 'Wesley Quintero',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wesleyquintero.vercel.app/',
    title: 'Wesley Quintero | Data Analytics Innovator',
    description:
      'Data Analytics Innovator and Founder of Nebula Suite, building tools that streamline workflows and provide valuable insights.',
    siteName: 'Wesley Quintero Portfolio',
    images: [
      {
        url: 'https://wesleyquintero.vercel.app/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Wesley Quintero Portfolio',
      },
      {
        url: `https://wesleyquintero.vercel.app${defaultImage}`,
        width: 1200,
        height: 630,
        alt: 'Wesley Quintero Portfolio Fallback',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wesley Quintero | Data Analytics Innovator',
    description:
      'Data Analytics Innovator and Founder of Nebula Suite, building tools that streamline workflows and provide valuable insights.',
    images: [
      'https://wesleyquintero.vercel.app/og-image.svg',
      `https://wesleyquintero.vercel.app${defaultImage}`,
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',       // Main favicon for browsers
    shortcut: '/favicon.ico',   // Shortcut icon
    apple: '/favicon.svg',      // Apple touch icon (if available)
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
        color: '#000000',
      },
    ],
  },
  manifest: '/site.webmanifest',
  metadataBase:
    process.env.NODE_ENV === 'development'
      ? new URL('http://localhost:3000')
      : new URL('https://wesleyquintero.vercel.app'),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  verification: {
    google: 'google-site-verification-code', // Replace with actual code
  },
  alternates: {
    canonical: 'https://wesleyquintero.vercel.app',
  },
  generator: 'Next.js',
  applicationName: 'Wesley Quintero Portfolio',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};
