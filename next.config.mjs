/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Memory optimization for development
  experimental: {
    // Reduce memory usage in development
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Optimize images
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
  // Headers for CSP and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: (
              process.env.NODE_ENV === 'development'
                ? [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob:",
                    "style-src 'self' 'unsafe-inline' https: http:",
                    "img-src 'self' data: https: blob:",
                    "font-src 'self' data:",
                    "connect-src 'self' https: wss:",
                    "frame-src 'self' https:",
                    "worker-src 'self' blob:",
                    "child-src 'self' blob:",
                    "object-src 'none'",
                    "base-uri 'self'"
                  ].join('; ')
                : [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://auth.privy.io https://*.privy.io https://challenges.cloudflare.com",
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "img-src 'self' data: https: blob:",
                    "font-src 'self' data: https://fonts.gstatic.com",
                    "connect-src 'self' https://auth.privy.io https://*.privy.io https://api.openrouter.ai https://*.neon.tech wss://*.privy.io https://fonts.googleapis.com https://fonts.gstatic.com https://pulse.walletconnect.org https://api.web3modal.org",
                    "frame-src 'self' https://auth.privy.io https://*.privy.io https://challenges.cloudflare.com",
                    "frame-ancestors 'self' https://auth.privy.io https://*.privy.io https://*.vercel.app",
                    "worker-src 'self' blob:",
                    "child-src 'self' blob:",
                    "object-src 'none'",
                    "base-uri 'self'"
                  ].join('; ')
            )
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/flags',
        destination: 'https://us.i.posthog.com/flags',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;