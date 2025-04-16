import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core settings
  output: 'standalone', // Keep if needed for deployment strategy
  // assetPrefix: '/', // Default, can be omitted
  // basePath: '', // Default, can be omitted

  // Build-time checks
  eslint: {
    // Linting is important, run it separately if ignoring here
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
    dirs: ['src'], // Adjust if code lives outside src
  },
  typescript: {
    // CRITICAL: Set to false and fix errors
    ignoreBuildErrors: false,
  },

  // Image Optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wesleyquintero.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true, // Ensure SVGs are safe if true
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Good with dangerouslyAllowSVG
    contentDispositionType: 'inline',
  },

  // Experimental features & optimizations
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // Necessary for standalone output in some setups (e.g., monorepos)
    outputFileTracingRoot: path.join(process.cwd(), '../'),
  },

  // Compiler options
  compiler: {
    // Remove console logs in production builds
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack customization
  webpack: (config, { webpack: webpackInstance, isServer, dev }) => {
    // Alias for @/ imports
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');

    // Rule for handling SVGs as React components
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    // Define environment variables (only if needed)
    // Consider using NEXT_PUBLIC_ for browser-accessible vars
    config.plugins.push(
      new webpackInstance.DefinePlugin({
        'process.env.IMAGE_DEBUG': JSON.stringify(
          process.env.IMAGE_DEBUG || 'false',
        ), // Provide default
      }),
    );

    // Example: Log only during development builds
    if (dev) {
      // console.log('Webpack config (dev only):', config); // Example conditional log
    }

    return config;
  },
};

// Remove the console log here, or make it conditional if needed for debugging
// if (process.env.NODE_ENV === 'development') {
//   console.log('Next.js config:', nextConfig);
// }

export default nextConfig;
