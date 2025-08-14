import { NextRequest, NextResponse } from 'next/server';
import { getServerFeatureFlags } from '@/lib/feature-flags';
import { validateCronAuth } from '@/lib/utils';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CRON authentication for API routes
  if (pathname.startsWith('/api/cron/')) {
    if (!validateCronAuth(request)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.next();
  }

  // Read feature flags per-request to avoid stale values in edge runtime
  const flags = getServerFeatureFlags();

  // Define routes that should be protected by feature flags
  const protectedRoutes = [
    { path: '/market-alpha', enabled: flags.showMarketAlpha },
    { path: '/portfolio', enabled: flags.showPortfolio },
    { path: '/search', enabled: flags.showSearch },
    { path: '/activity', enabled: flags.showActivity },
    { path: '/tos', enabled: flags.showTermsOfService },
    { path: '/privacy', enabled: flags.showPrivacyPolicy }
  ];

  // Check if the current path matches any protected route
  for (const route of protectedRoutes) {
    if (pathname.startsWith(route.path)) {
      if (!route.enabled) {
        // Redirect to home page if feature is disabled
        return NextResponse.redirect(new URL('/', request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * 
     * Note: API routes are now included to handle CRON authentication
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};
