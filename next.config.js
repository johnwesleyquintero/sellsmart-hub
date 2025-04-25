import path from 'path';

/** @type {import('next').NextConfig} */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Core settings
  // output: 'standalone', // Keep if needed for Docker/standalone deployment

  // Build-time checks
  // --- ESLint block removed ---
  // Recommendation: Run 'npm run lint' separately in your workflow/CI pipeline.

  typescript: {
    // CRITICAL: Keep this false to ensure type safety in builds.
    ignoreBuildErrors: false,
  },

  // Image Optimization (Looks good, keep as is unless specific needs arise)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wesleyquintero.vercel.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      // Remove the empty hostname pattern below as it's invalid
      /* DELETE THIS ENTRY - CAUSING BUILD FAILURE
      {
        protocol: 'http',
        hostname: '', // Empty string is invalid
        pathname: '/public/**',
      },
      */
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true, // Use with caution: Ensure SVGs are trusted/sanitized.
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    contentDispositionType: 'inline',
  },

  // Experimental features & optimizations
  experimental: {
    esmExternals: true,
    // Disabled experimental features for build stability
    webpackBuildWorker: false,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
    // Enable server actions for form submissions
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // Compiler options
  compiler: {
    // Remove console logs in production builds
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Webpack customization
  webpack: (config, { webpack: webpackInstance, isServer, dev }) => {
    // Enable minification in production for better performance
    if (!dev) {
      config.optimization.minimize = true;
    }
    // Define environment variables (build-time/server-side)
    // Use NEXT_PUBLIC_ prefix for variables needed in the browser
    // Removed redundant DefinePlugin configuration

    // Alias for @/ imports (assuming source code is primarily in 'src')
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'src'),
      path: require.resolve('path-browserify'),
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: false,
    };

    // Rule for handling SVGs as React components using @svgr/webpack
    // Ensure you have @svgr/webpack installed (`npm install --save-dev @svgr/webpack`)
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: false,
            titleProp: true,
          },
        },
      ],
    });

    // Define environment variables (build-time/server-side)
    // Use NEXT_PUBLIC_ prefix for variables needed in the browser
    config.plugins.push(
      new webpackInstance.DefinePlugin({
        'process.env.IMAGE_DEBUG': JSON.stringify(
          process.env.IMAGE_DEBUG || 'false', // Provide default
        ),
      }),
    );

    config.externals = isServer
      ? [
          ...(config.externals || []),
          /^node:/,
          /^mongodb/,
          {
            '@next-auth/mongodb-adapter': 'commonjs @next-auth/mongodb-adapter',
            dns: 'commonjs dns',
            fs: 'commonjs fs',
            net: 'commonjs net',
            tls: 'commonjs tls',
            child_process: 'commonjs child_process',
            path: 'commonjs path',
            util: 'commonjs util',
            stream: 'commonjs stream',
            crypto: 'commonjs crypto',
            os: 'commonjs os',
            http: 'commonjs http',
            https: 'commonjs https',
            zlib: 'commonjs zlib',
            process: 'commonjs process',
          },
        ]
      : config.externals;

    return config;
  },
};

export default nextConfig;
