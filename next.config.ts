import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-1ca0bfa407764a49a1aa24c9481a4e7e.r2.dev',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'brujosclassifieds.com' }],
        destination: 'https://www.brujosclassifieds.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
