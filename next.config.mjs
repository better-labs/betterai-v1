/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Memory optimization and Prisma externalization for Next.js 15
  experimental: {
    // Reduce memory usage in development
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Reduce development logging verbosity
  logging: {
    fetches: {
      fullUrl: false, // Reduce verbose fetch logging
      hmrRefreshes: process.env.NODE_ENV === 'development',
    },
    // Suppress verbose development logs including Inngest
    level: process.env.NODE_ENV === 'development' ? 'error' : 'error',
  },
  // Externalize Prisma for server components (Next.js 15 best practice)
  serverExternalPackages: ['@prisma/client'],
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
                    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://auth.privy.io",
                    "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://tagmanager.google.com https://auth.privy.io https://us.i.posthog.com https://us-assets.i.posthog.com",
                    "style-src 'self' 'unsafe-inline' https: http: https://fonts.googleapis.com",
                    "img-src 'self' data: https: blob:",
                    "font-src 'self' data: https://fonts.gstatic.com",
                    "connect-src 'self' https: wss: https://fonts.googleapis.com https://fonts.gstatic.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
                    "frame-src 'self' https:",
                    "frame-ancestors 'self' https://auth.privy.io https://*.privy.io https://*.vercel.app https://betterai.tools https://*.betterai.tools http://localhost:* https://localhost:*",
                    "worker-src 'self' blob:",
                    "child-src 'self' https://auth.privy.io blob:",
                    "object-src 'none'",
                    "base-uri 'self'"
                  ].join('; ')
                : [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://auth.privy.io https://*.privy.io https://challenges.cloudflare.com https://us.i.posthog.com https://us-assets.i.posthog.com https://vercel.live https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com",
                    "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://tagmanager.google.com https://auth.privy.io https://*.privy.io https://us.i.posthog.com https://us-assets.i.posthog.com",
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "img-src 'self' data: https: blob:",
                    "font-src 'self' data: https://fonts.gstatic.com",
                    "connect-src 'self' https://auth.privy.io https://*.privy.io https://api.openrouter.ai https://*.neon.tech wss://*.privy.io https://fonts.googleapis.com https://fonts.gstatic.com https://pulse.walletconnect.org https://api.web3modal.org https://us.i.posthog.com https://us-assets.i.posthog.com https://explorer-api.walletconnect.com https://*.walletconnect.com https://*.walletconnect.org https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
                    "frame-src 'self' https://auth.privy.io https://*.privy.io https://challenges.cloudflare.com https://vercel.live",
                    "frame-ancestors 'self' https://auth.privy.io https://*.privy.io https://*.vercel.app https://betterai.tools https://*.betterai.tools http://localhost:* https://localhost:*",
                    "worker-src 'self' blob:",
                    "child-src 'self' https://auth.privy.io blob:",
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