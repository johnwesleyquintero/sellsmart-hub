import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

// Define CSP
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com *.vercel.app;
  child-src 'none';
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' blob: data: *.githubusercontent.com;
  frame-src 'none';
  connect-src 'self' https://api.github.com vitals.vercel-insights.com;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
    providerImportSource: "@mdx-js/react",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // webpackBuildWorker: true, // Disabled for debugging font error
    // parallelServerBuildTraces: true, // Disabled for debugging font error
    // parallelServerCompiles: true, // Disabled for debugging font error
    // optimizePackageImports: ['lucide-react', '@shadcn/ui'] // Disabled for debugging font error
    serverActions: {
      bodySizeLimit: "2mb",
    },
    serverComponents: true,
    // Enable strict mode for server/client boundary
    serverComponentsExternalPackages: ["@sentry/node"],
    // Enable proper module resolution
    esmExternals: true,
    // Improve module loading
    modularizeImports: {
      "lucide-react": {
        transform: "lucide-react/dist/esm/icons/{{member}}",
      },
    },
    // Enable better error handling
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: ["localhost:3000"],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wesleyquintero.vercel.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  reactStrictMode: true,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: ContentSecurityPolicy,
        },
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
      ],
    },
  ],
  compress: true,
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  webpack: (config, { dev, isServer }) => {
    // Fix module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
      path: false,
    };

    // Improve module loading
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "babel-loader",
          options: {
            presets: ["next/babel"],
          },
        },
      ],
    });

    return config;
  },
};

// Only use Sentry in production
const config =
  process.env.NODE_ENV === "production" ? withMDX(nextConfig) : nextConfig;

export default config;
