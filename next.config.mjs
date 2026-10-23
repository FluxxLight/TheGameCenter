/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '*.e2b.app',
    '*.vercel.app',
    'localhost',
    '127.0.0.1',
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
