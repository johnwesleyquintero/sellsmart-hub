import path from 'path';

/** @type {import('next').NextConfig} */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },
  // Core settings
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Resolve SWC/Babel conflict
  experimental: {
    forceSwcTransforms: false,
    optimizeCss: false,
    optimizeServerReact: false,
    serverActions: {
      allowedOrigins: ['localhost:3000', 'wesleyquintero.vercel.app'],
      bodySizeLimit: '4mb',
    },
  },
  // Enable importAttributes syntax
  compiler: {
    styledComponents: true,
  },

  // Build-time checks
  typescript: {
    ignoreBuildErrors: false,
  },

  // Enhanced Image Optimization
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
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: process.env.NODE_ENV === 'development',
    disableStaticImages: false,
    domains: [],
  },

  // Modern Experimental Features
  serverExternalPackages: ['mongoose', '@next-auth/mongodb-adapter'],
  // Compiler options
  compiler: {
    // Remove console logs in production builds
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable SWC for next/font
    styledComponents: true,
  },
  // Webpack customization
  webpack: (config, { webpack: webpackInstance, isServer, dev }) => {
    // Disable minification completely to avoid WebpackError constructor issues
    config.optimization.minimize = false;
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
      dns: false,
      net: false,
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
            fs: 'commonjs fs',
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
