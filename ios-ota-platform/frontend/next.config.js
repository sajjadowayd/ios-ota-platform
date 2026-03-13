/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/files/**',
      },
      {
        protocol: 'https',
        hostname: '*.trycloudflare.com',
        pathname: '/files/**',
      },
    ],
  },
};

module.exports = nextConfig;
