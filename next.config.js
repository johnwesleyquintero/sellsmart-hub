/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If you were using string-replace-loader directly, configure it here.
  // However, it's more likely that another package requires it.
  // In that case, identify the package and address its configuration.
  webpack: (config, { isServer }) => {
    // Example: If you need to configure a specific loader
    // config.module.rules.push({
    //   test: /\.svg$/,
    //   use: ['@svgr/webpack'],
    // });

    return config;
  },
};

module.exports = nextConfig;
