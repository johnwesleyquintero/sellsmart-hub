import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
    providerImportSource: "@mdx-js/react"
  },
})

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    // webpackBuildWorker: true, // Disabled for debugging font error
    // parallelServerBuildTraces: true, // Disabled for debugging font error
    // parallelServerCompiles: true, // Disabled for debugging font error
    // optimizePackageImports: ['lucide-react', '@shadcn/ui'] // Disabled for debugging font error
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wesleyquintero.vercel.app',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**'
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp'],
    minimumCacheTTL: 60
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
  compress: true
};

export default config;
