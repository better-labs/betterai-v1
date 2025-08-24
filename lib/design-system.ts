/**
 * Design System - Centralized UX layout standards for BetterAI
 * 
 * This file contains consistent spacing, typography, and layout patterns
 * used throughout the application for professional, polished layouts.
 * 
 * COMPONENT ORGANIZATION:
 * - components/client/   : Interactive components with "use client" directive
 * - components/server/   : Data-fetching server components (SSR)
 * - components/shared/   : Pure presentational components (no data deps)
 * - components/providers/: React context providers and wrappers
 * - components/ui/       : shadcn/ui design system components
 * - components/docs/     : Documentation-specific components
 * 
 * ESLint rules enforce this structure to prevent mixing concerns and
 * ensure proper separation between client/server boundaries.
 */

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  // Major section spacing
  section: 'mb-24',        // 6rem/96px between major sections
  hero: 'py-16 mb-24',     // 4rem/64px vertical padding, 6rem/96px bottom margin
  divider: 'my-16',        // 4rem/64px margin for border separators
  
  // Content spacing within sections
  content: 'mb-12',        // 3rem/48px between content areas within sections
  cta: 'mt-8',            // 2rem/32px top margin for secondary actions
  
  // Typography spacing
  title: 'mb-6',          // 1.5rem/24px bottom margin for titles
  heading: 'mb-6',        // 1.5rem/24px bottom margin for headings
  
  // Component spacing
  card: 'p-6',            // 1.5rem/24px padding for cards
  button: 'px-4 py-2',    // 1rem/16px horizontal, 0.5rem/8px vertical for buttons
  input: 'px-3 py-2',     // 0.75rem/12px horizontal, 0.5rem/8px vertical for inputs
} as const;

// ============================================================================
// LAYOUT PATTERNS
// ============================================================================

export const layout = {
  // Page structure
  page: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'mb-24',
    hero: 'py-16 mb-24',
  },
  
  // Grid systems
  grid: {
    cols: {
      '1': 'grid-cols-1',
      '2': 'grid-cols-1 md:grid-cols-2',
      '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    },
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12',
    }
  },
  
  // Flexbox patterns
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    row: 'flex flex-row',
  }
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const typography = {
  // Font sizes with consistent line heights
  h1: 'text-4xl font-bold leading-tight mb-6',
  h2: 'text-3xl font-semibold leading-tight mb-6',
  h3: 'text-2xl font-semibold leading-tight mb-4',
  h4: 'text-xl font-medium leading-tight mb-3',
  h5: 'text-lg font-medium leading-tight mb-2',
  h6: 'text-base font-medium leading-tight mb-2',
  
  // Body text
  body: 'text-base leading-relaxed',
  bodyLarge: 'text-lg leading-relaxed',
  bodySmall: 'text-sm leading-relaxed',
  
  // Special text
  caption: 'text-sm text-muted-foreground',
  label: 'text-sm font-medium',
} as const;

// ============================================================================
// COMPONENT PATTERNS
// ============================================================================

export const components = {
  // Card patterns
  card: {
    base: 'bg-card border border-border rounded-lg shadow-sm',
    padding: 'p-6',
    hover: 'hover:shadow-md transition-shadow duration-200',
  },
  
  // Button patterns
  button: {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8',
    }
  },
  
  // Input patterns
  input: {
    base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  }
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Combine multiple spacing classes
 */
export function combineSpacing(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get responsive spacing based on breakpoint
 */
export function getResponsiveSpacing(
  mobile: string,
  tablet: string = mobile,
  desktop: string = tablet
): string {
  return `${mobile} md:${tablet} lg:${desktop}`;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type SpacingKey = keyof typeof spacing;
export type LayoutKey = keyof typeof layout;
export type TypographyKey = keyof typeof typography;
export type ComponentKey = keyof typeof components;
