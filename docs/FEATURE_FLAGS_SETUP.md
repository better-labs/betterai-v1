# Simple Feature Flags Setup Guide

## Overview

This project uses a simple, custom feature flags system to control page visibility across different environments. The implementation follows best practices for maintainability and minimal complexity without external dependencies.

## Features

- **Environment-based defaults**: All pages visible in development, restricted pages hidden in production
- **Environment variable control**: Easy flag management through environment variables
- **Page-level protection**: Middleware redirects users from disabled pages
- **Navigation updates**: Header navigation respects feature flag states
- **Zero dependencies**: No external packages required, built with standard Next.js patterns

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# Feature Flags Configuration
# Set to "1" or "true" to enable features in production
# Features are enabled by default in development
SHOW_MARKET_ALPHA=false
SHOW_PORTFOLIO=false
SHOW_SEARCH=false
SHOW_ACTIVITY=false
SHOW_TOS=false
SHOW_PRIVACY=false
```

### 2. Development vs Production

- **Development**: All features are visible by default
- **Production**: Features are hidden unless explicitly enabled via environment variables

### 3. Deploy and Test

1. Deploy your project
2. Set environment variables in your deployment platform (Vercel, etc.)
3. Features will be visible/hidden based on your configuration

## Feature Flags

| Flag | Key | Description | Default (Dev) | Default (Prod) |
|------|-----|-------------|---------------|----------------|

| Portfolio | `show-portfolio` | Controls Portfolio page visibility | Visible | Hidden |
| Search | `show-search` | Controls Search functionality | Visible | Hidden |
| Activity | `show-activity` | Controls Activity page visibility | Visible | Hidden |
| Terms of Service | `show-tos` | Controls ToS page visibility | Visible | Hidden |
| Privacy Policy | `show-privacy` | Controls Privacy page visibility | Visible | Hidden |

## Architecture

### Files Structure

```
lib/
├── feature-flags.ts          # Flag definitions and configuration
└── hooks/
    └── use-feature-flags.ts   # Client-side hook for flag access

app/api/flags/route.ts         # API endpoint for Vercel toolbar

middleware.ts                  # Route protection middleware

components/
└── header.tsx                 # Updated navigation with flag awareness
```

### How It Works

1. **Flag Definition**: Flags are defined in `lib/feature-flags.ts` with environment-based defaults
2. **Client Components**: Use `useFeatureFlags()` hook to access flag states
3. **Server Components**: Use `getFeatureFlags()` for server-side flag checking
4. **Route Protection**: Middleware automatically redirects users from disabled pages
5. **Navigation**: Header component conditionally renders navigation items

## Usage Examples

### Client Components

```tsx
import { useFeatureFlags } from '@/lib/hooks/use-feature-flags';

export function MyComponent() {
  const flags = useFeatureFlags();
  
  return (
    <div>
      {flags.showPortfolio && (
        <Link href="/portfolio">Portfolio</Link>
      )}
    </div>
  );
}
```

### Server Components

```tsx
import { getFeatureFlags } from '@/lib/hooks/use-feature-flags';

export default async function MyPage() {
  const flags = await getFeatureFlags();
  
  if (!flags.showPortfolio) {
    redirect('/');
  }
  
  return <div>Portfolio Content</div>;
}
```

## Development vs Production Behavior

### Development Environment
- All pages are visible by default
- Easy testing of complete application functionality
- Flags can be overridden using environment variables

### Production Environment
- Restricted pages are hidden by default
- Use Vercel toolbar or dashboard to enable specific features
- Provides controlled rollout capability

## Best Practices

1. **Minimal Flags**: Only create flags for features that need environment-specific control
2. **Clear Naming**: Use descriptive flag names with consistent prefixes
3. **Documentation**: Always document what each flag controls
4. **Testing**: Test both enabled and disabled states
5. **Cleanup**: Remove flags and their usage when features are permanently enabled

## Troubleshooting

### Environment Variables Not Working
1. Ensure environment variables are set correctly in your deployment platform
2. Restart your development server after changing local environment variables
3. Check that variable names match exactly (case-sensitive)

### Flags Not Updating
1. Verify middleware is properly configured
2. Clear browser cache and restart development server
3. Check console for any JavaScript errors

### Production vs Development Behavior
1. Development environment shows all features by default
2. Production environment respects environment variable settings
3. Test production behavior using preview deployments or staging environments
