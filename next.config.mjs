/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Use Next.js image optimizer and allow S3/Polymarket hosts
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'polymarket-upload.s3.us-east-2.amazonaws.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // cache optimized images for 1 day
  },
  // Note: Vercel toolbar is automatically enabled when FLAGS_SECRET is set
}

export default nextConfig
