/**
 * Design System - Centralized UX layout standards for BetterAI
 * 
 * This file contains consistent spacing, typography, and layout patterns
 * used throughout the application for professional, polished layouts.
 * 
 * Key Principles:
 * - Consistency: Always use design system tokens instead of hardcoded values
 * - Accessibility: Include proper focus states and WCAG compliant touch targets
 * - Mobile First: Design for mobile, then enhance for larger screens
 * - Performance: Prefer CSS classes over inline styles
 * - Maintainability: Keep the design system centralized and well-documented
 * 
 * Layout Best Practices:
 * - Flex Spacing: Use margin (my-*) for vertical spacing between flex items, not padding
 *   Flex containers can compress padding but respect margin spacing between items
 */

// ============================================================================
// SPACING SYSTEM - Consistent spacing for professional layouts
// ============================================================================

/**
 * Spacing tokens for consistent vertical and horizontal rhythm throughout the app.
 * Use these tokens to maintain consistent spacing between major sections, content areas,
 * and component elements.
 */
export const spacing = {
  // Major section spacing (large visual separation)
  section: 'mb-24',        // 6rem/96px - between major page sections
  hero: 'py-16 mb-24',     // 4rem/64px vertical padding, 6rem/96px bottom margin
  divider: 'my-16',        // 4rem/64px - for visual border separators
  
  // Content spacing within sections (moderate visual separation) 
  content: 'mb-12',        // 3rem/48px - between content areas within sections
  cta: 'mt-8',            // 2rem/32px - top margin for secondary actions
  
  // Typography spacing (text rhythm)
  heading: 'mb-6',        // 1.5rem/24px - bottom margin for headings
  
  // Component spacing (internal component padding)
  card: 'p-6',            // 1.5rem/24px - padding for cards and containers
  button: 'px-4 py-2',    // 1rem/16px horizontal, 0.5rem/8px vertical
  input: 'px-3 py-2',     // 0.75rem/12px horizontal, 0.5rem/8px vertical
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
// INTERACTION TOKENS - Touch targets and interactive elements (WCAG Compliant)
// ============================================================================

/**
 * Touch target and interactive element sizing following WCAG guidelines.
 * These tokens ensure accessibility across all devices and input methods.
 */
export const interaction = {
  // Touch target sizes following WCAG and platform guidelines
  touchTarget: {
    minimum: 'w-10 h-10',   // 40px - WCAG 2.2 AA compliance (minimum)
    standard: 'w-11 h-11',  // 44px - WCAG 2.1 AAA compliance (recommended)
    enhanced: 'w-12 h-12',  // 48px - complex interactive elements
  },
  
  // Interactive container widths and spacing for icon containers and flex layouts
  container: {
    // Width tokens
    minWidth: 'w-11',       // 44px - matches standard touch target (WCAG AAA)
    standard: 'w-10',       // 40px - basic icon containers (WCAG AA)
    compact: 'w-8',         // 32px - minimal but functional for tight layouts
    
    // Vertical margin tokens for flex spacing (use margin, not padding - see dropdown.item)
    marginMin: 'my-0.5',    // 2px - minimal vertical spacing
    marginStandard: 'my-1', // 4px - standard vertical spacing between flex items
    marginComfortable: 'my-2', // 8px - comfortable vertical spacing
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
    
    // Flex-based search input (INDUSTRY STANDARD PATTERN)
    // Used by Google, GitHub, and most modern web apps
    // Advantages: predictable layout, no z-index conflicts, better accessibility
    search: {
      container: 'flex items-center bg-muted/50 border border-muted-foreground/20 rounded-md focus-within:bg-background transition-colors w-full',
      iconLeft: `${interaction.container.standard} flex items-center justify-center text-muted-foreground px-2`,
      input: 'flex-1 px-3 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground',
      iconRight: `${interaction.container.standard} flex items-center justify-center text-muted-foreground px-2`,
      button: 'h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
    }

  },
  
  // Dropdown menu patterns
  dropdown: {
    // Content container
    content: 'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-background py-2 text-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    
    // Menu items - IMPORTANT: Use margin (my-1) for vertical spacing, not padding
    // Flex layouts with items-center can compress vertical padding, making it ineffective
    // Margin creates actual space BETWEEN flex items that containers can't override
    item: 'relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2 my-1 text-base outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
    
    // Sub-trigger for nested menus - consistent margin spacing
    subTrigger: 'flex cursor-default gap-2 select-none items-center rounded-sm px-3 py-2 my-1 text-base outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
    
    // Labels and separators
    label: 'px-3 py-2 text-sm font-semibold',
    separator: '-mx-1 my-2 h-px bg-muted',
    
    // Shortcut text
    shortcut: 'ml-auto text-xs tracking-widest opacity-60',
    
    // Checkbox and radio items - using margin spacing consistent with other items
    checkboxItem: 'relative flex cursor-default select-none items-center rounded-sm py-2 my-1 pl-8 pr-3 text-base outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    radioItem: 'relative flex cursor-default select-none items-center rounded-sm py-2 my-1 pl-8 pr-3 text-base outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    
    // Indicator positioning
    indicator: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center',
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
  
  // Navigation link patterns (CLEAN DESIGN - NO ARROWS/CHEVRONS)
  // Following modern web accessibility standards and clean design principles
  navigation: {
    // Primary navigation links
    link: {
      base: 'text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors',
      active: 'text-foreground font-medium', // Current page indicator
      subtle: 'text-muted-foreground/70 hover:text-muted-foreground transition-colors',
    },
    
    // "View all" style links - clean without decorative elements
    // Modern design principle: let content and behavior indicate clickability
    viewAll: {
      base: 'text-sm text-primary hover:text-primary/80 font-medium transition-colors',
      muted: 'text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors',
      accessible: `text-sm text-primary hover:text-primary/80 font-medium transition-colors ${accessibility.focus.default}`,
    },
    
    // Breadcrumb navigation
    breadcrumb: {
      item: 'text-muted-foreground hover:text-foreground transition-colors',
      separator: 'text-muted-foreground/50 mx-2',
      current: 'text-foreground font-medium',
    },
    
    // Mobile navigation menu patterns - consistent with dropdown spacing
    mobileMenu: {
      // Container for mobile dropdown menu
      container: 'bg-background border border-border shadow-lg',
      // Menu items - using my-1 margin for proper flex spacing (see dropdown.item comment)
      item: 'flex items-center gap-3 px-3 py-2 my-1 text-base font-medium transition-colors hover:bg-accent focus:bg-accent',
      // Icon sizing for menu items
      icon: 'h-5 w-5 flex-shrink-0',
      // Separator styling
      separator: 'my-2 border-t border-border',
      // Submenu trigger styling with consistent margin spacing
      subTrigger: 'flex items-center justify-between w-full px-3 py-2 my-1 text-base font-medium transition-colors hover:bg-accent focus:bg-accent',
      // Submenu content styling
      subContent: 'bg-background border border-border shadow-lg',
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

  // Page header patterns - consistent headers across pages
  pageHeader: {
    // Main page header container with consistent spacing
    container: 'text-center mb-12',
    
    // Main page title with icon (like homepage "Trending Markets")
    titleWithIcon: `${typography.h1} flex items-center justify-center gap-2`,
    
    // Main page title without icon
    title: typography.h1,
    
    // Page subtitle/description
    subtitle: `${typography.body} text-muted-foreground`,
    
    // Icon styling for page headers
    icon: 'text-primary',
    
    // Alternative compact header for detail pages
    compact: {
      container: 'mb-8',
      title: `${typography.h2} text-center`,
      subtitle: `${typography.bodySmall} text-muted-foreground text-center`,
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

// ============================================================================
// USAGE EXAMPLES AND PATTERNS
// ============================================================================

/**
 * Common usage patterns and examples for the design system.
 * Copy these patterns for consistent implementation across the app.
 */
export const usageExamples = {
  // Basic card with proper spacing
  card: `
    <div className={\`\${components.card.base} \${spacing.card}\`}>
      <h3 className={\`\${typography.h3} \${spacing.heading}\`}>Card Title</h3>
      <p className={typography.body}>Card content goes here.</p>
    </div>
  `,
  
  // Search input with flex layout (industry standard)
  searchInput: `
    <div className={components.input.search.container}>
      <div className={components.input.search.iconLeft}>
        <Search className="h-4 w-4" />
      </div>
      <input 
        className={components.input.search.input}
        placeholder="Search markets..."
      />
      <div className={components.input.search.iconRight}>
        <button className={components.input.search.button}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  `,
  
  // Button with proper accessibility
  button: `
    <button className={\`\${components.button.base} \${components.button.size.md} \${components.button.variant.primary}\`}>
      Predict with AI
    </button>
  `,
  
  // Navigation link without decorative arrows
  navigationLink: `
    <Link 
      href="/predictions" 
      className={components.navigation.viewAll.accessible}
    >
      View all predictions
    </Link>
  `,
  
  // Dropdown menu with proper spacing
  dropdownMenu: `
    <DropdownMenuContent className={components.dropdown.content}>
      <DropdownMenuItem className={components.dropdown.item}>
        Profile
      </DropdownMenuItem>
      <DropdownMenuSeparator className={components.dropdown.separator} />
      <DropdownMenuItem className={components.dropdown.item}>
        Settings
      </DropdownMenuItem>
    </DropdownMenuContent>
  `
} as const;
