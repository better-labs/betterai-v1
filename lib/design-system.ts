/**
 * Design System - Centralized UX layout standards for BetterAI
 * 
 * This file contains consistent spacing, typography, and layout patterns
 * used throughout the application for professional, polished layouts.
 * 
 * For comprehensive documentation and usage examples, see DESIGN_SYSTEM.md
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
  // Page structure (references spacing tokens to reduce redundancy)
  page: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: spacing.section, // Reference spacing tokens
    hero: spacing.hero,
  },
  
  // Essential grid systems
  grid: {
    // Responsive columns
    cols: {
      '1': 'grid-cols-1',
      '2': 'grid-cols-1 md:grid-cols-2',
      '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    },
    
    // Grid gaps
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    },
  }
} as const;

// ============================================================================
// INTERACTION TOKENS (touch targets, interactive elements)
// ============================================================================

export const interaction = {
  // Touch target sizes following WCAG and platform guidelines
  touchTarget: {
    // Minimum for WCAG 2.2 AA compliance
    minimum: 'w-10 h-10',   // 40px - WCAG AA compliance
    // Recommended for WCAG 2.1 AAA and optimal UX  
    standard: 'w-11 h-11',  // 44px - WCAG AAA compliance
    // Enhanced for complex interactive elements
    enhanced: 'w-12 h-12',  // 48px - complex controls
  },
  
  // Interactive container widths (for icon containers, etc.)
  container: {
    // Minimum functional width for icon containers
    minWidth: 'w-11',       // 44px - matches standard touch target
    // Standard width for most interactive containers  
    standard: 'w-10',       // 40px - basic icon containers
    // Compact width for tight layouts
    compact: 'w-8',         // 32px - minimal but functional
  }
} as const;

// ============================================================================
// CORE TOKENS (radii, elevation, durations, z-index)
// ============================================================================

export const radii = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

export const elevation = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
} as const;

// Animation system with modern easing and durations
export const animation = {
  duration: {
    instant: 'duration-0',
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500',
    slower: 'duration-700',
  },
  
  easing: {
    // Standard CSS easing
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
    
    // Modern cubic-bezier curves
    spring: 'ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
    natural: 'ease-[cubic-bezier(0.4,0.0,0.2,1)]',
    sharp: 'ease-[cubic-bezier(0.4,0.0,0.6,1)]',
    emphasized: 'ease-[cubic-bezier(0.2,0.0,0,1)]',
  }
} as const;

// Legacy duration export for backward compatibility
export const duration = animation.duration;

export const zIndex = {
  dropdown: 'z-20',
  popover: 'z-30',
  modal: 'z-50',
  toast: 'z-50',
} as const;

// Enhanced focus management for accessibility
export const accessibility = {
  focus: {
    // Default focus styling with ring
    default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
    // High visibility focus for critical actions
    high: 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-primary',
    // Inset ring for compact elements
    inset: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
    // Subtle focus for secondary elements
    subtle: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-muted-foreground',
    // Custom color focus rings
    success: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500',
    warning: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-500',
    destructive: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500',
  },
  
  // Skip to content link
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium',
  
  // Screen reader only text
  srOnly: 'sr-only',
  
  // ARIA live regions
  liveRegion: {
    polite: 'sr-only',
    assertive: 'sr-only',
  },
  
  // Focus trap boundaries
  focusTrap: {
    start: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0',
    end: 'sr-only focus:not-sr-only focus:absolute focus:bottom-0 focus:right-0',
  }
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const typography = {
  // Headings
  h1: 'text-2xl md:text-3xl lg:text-4xl font-bold leading-tight',
  h2: 'text-xl md:text-2xl lg:text-3xl font-semibold leading-tight',
  h3: 'text-lg md:text-xl lg:text-2xl font-semibold leading-tight',
  h4: 'text-base md:text-lg lg:text-xl font-medium leading-tight',
  
  // Body text with fluid scaling
  body: 'text-[clamp(0.875rem,1.5vw,1rem)] leading-relaxed', // 14px-16px
  bodyLarge: 'text-[clamp(1rem,2vw,1.125rem)] leading-relaxed', // 16px-18px
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
    hover: 'hover:shadow-md transition-shadow duration-200',
  },
  
  // Button patterns with hierarchy
  button: {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm', 
      lg: 'h-11 px-6 text-base',
    },
    variant: {
      // High emphasis - most important actions (e.g., "Predict with AI")
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      // Medium emphasis - secondary actions  
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
      // Low emphasis - tertiary actions (e.g., "Show More")
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    }
  },
  
  // Input patterns
  input: {
    base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    
    // Simplified search input using flex-based layout (INDUSTRY STANDARD)
    search: {
      container: 'flex items-center bg-muted/50 border border-muted-foreground/20 rounded-md focus-within:bg-background transition-colors w-full',
      iconLeft: 'w-11 flex items-center justify-center text-muted-foreground px-2',
      input: 'flex-1 px-3 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground',
      iconRight: 'w-11 flex items-center justify-center text-muted-foreground px-2',
      button: 'h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
    }

  },
  
  // Tooltip patterns
  tooltip: {
    trigger: 'cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-4 hover:decoration-foreground transition-colors',
    content: 'text-sm bg-popover text-popover-foreground border border-border rounded-md px-3 py-2 shadow-lg',
  },


  // Card footer metadata patterns
  cardFooter: {
    // Container for metadata section at bottom of cards
    container: 'pt-3',
    
    // Individual metadata items
    item: 'text-xs text-muted-foreground',
    
    // Layout patterns for metadata
    layout: {
      // Single centered item (e.g., just a link)
      single: 'text-center',
      // Two items side by side
      split: 'flex justify-between items-center',
      // Multiple items in a row with spacing
      row: 'flex items-center gap-4 flex-wrap',
      // Stacked items with small spacing
      stack: 'space-y-1',
    },
    
    // Link styling for metadata
    link: 'underline underline-offset-4 hover:text-foreground transition-colors',
    
    // Badge styling for metadata tags
    metadataBadge: 'px-2 py-1 bg-muted/50 text-muted-foreground rounded text-xs font-normal',
    
    // Timestamp styling
    timestamp: 'tabular-nums',
  },
  
  // Navigation link patterns (BEST PRACTICE: NO ARROWS/CHEVRONS)
  navigation: {
    // Primary navigation links
    link: {
      // Default navigation link styling
      base: 'text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors',
      // Active state for current page
      active: 'text-foreground font-medium',
      // Subtle variant for secondary navigation
      subtle: 'text-muted-foreground/70 hover:text-muted-foreground transition-colors',
    },
    
    // "View all" style links (common pattern)
    viewAll: {
      // Standard "View all" link without decorative elements
      base: 'text-sm text-primary hover:text-primary/80 font-medium transition-colors',
      // Muted variant for less prominent contexts
      muted: 'text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors',
      // With focus states for accessibility
      accessible: `text-sm text-primary hover:text-primary/80 font-medium transition-colors ${accessibility.focus.default}`,
    },
    
    // Breadcrumb navigation
    breadcrumb: {
      item: 'text-muted-foreground hover:text-foreground transition-colors',
      separator: 'text-muted-foreground/50 mx-2',
      current: 'text-foreground font-medium',
    },
  },
  
  // Consolidated interactive patterns for simpler API
  interactive: {
    // Basic interactive card with hover effects
    card: 'group relative hover:shadow-md transition-shadow duration-200 cursor-pointer',
    
    // Card link overlay with proper focus management
    cardLink: 'before:absolute before:inset-0 before:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring',
    
    // Safe area for interactive elements inside interactive cards
    safeArea: 'relative z-10',
    
    // Hover states
    hover: {
      lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
      glow: 'hover:shadow-lg hover:shadow-primary/10 transition-shadow duration-200',
      scale: 'hover:scale-105 transition-transform duration-200',
    },
    
    // Focus states (uses accessibility.focus patterns)
    focus: accessibility.focus.default,
    
    // Legacy properties for backward compatibility (DEPRECATED)
    /** @deprecated Use safeArea instead */
    interactiveZone: 'relative z-10 pointer-events-auto',
    /** @deprecated Use card instead */
    overlayContainer: 'relative group',
    /** @deprecated Use before: pseudo-element pattern instead */
    nonInteractiveOverlay: 'absolute inset-0 pointer-events-none',
    /** @deprecated Use cardLink instead */
    fullOverlay: 'absolute inset-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring',
  },
  
  // Disclosure/expand patterns (for show more buttons, etc.)
  disclosure: {
    // Icon sizing for disclosure indicators
    icon: 'transition-transform duration-200',
    iconSm: 'w-4 h-4',
    iconMd: 'w-5 h-5',
    iconLg: 'w-6 h-6',
    // Rotation states
    expanded: 'rotate-180',
    collapsed: 'rotate-0',
  },

  // Outcome display patterns for market predictions
  outcome: {
    // Container for grouped outcomes (like Yes/No results)
    container: 'space-y-1',
    
    // Individual outcome row with consistent spacing
    row: 'flex items-center gap-3 text-sm px-3 py-2',
    
    // Label styling (e.g., "Yes", "No", "Outcome A")
    label: 'truncate',
    
    // Value styling (e.g., "60%", probability values)
    value: 'font-semibold tabular-nums',
    
    // Compact variant for smaller spaces
    compact: {
      row: 'flex items-center gap-2 text-xs px-2 py-1.5',
      label: 'truncate',
      value: 'font-semibold tabular-nums',
    }
  },

  // Motion patterns for Framer Motion components
  motion: {
    // Expandable content containers
    expandable: {
      // Base classes for expandable content
      container: 'relative overflow-hidden break-words whitespace-pre-wrap w-full',
      // Inline styles for text wrapping
      textWrap: { wordWrap: 'break-word' as const, overflowWrap: 'anywhere' as const },
      // Animation settings
      animation: {
        duration: 0.2,
        ease: "easeInOut" as const,
      },
      // Height settings
      collapsedHeight: '8rem',
    },
    
    // Fade overlay for collapsed content
    fadeOverlay: {
      // Base classes for fade gradient
      container: 'absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/20 to-transparent',
      // Animation settings
      animation: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        duration: 0.15,
      },
    }
  },


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
export type InteractionKey = keyof typeof interaction;
