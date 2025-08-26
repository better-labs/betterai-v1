/**
 * Design System - Centralized UX layout standards for BetterAI
 * 
 * This file contains consistent spacing, typography, and layout patterns
 * used throughout the application for professional, polished layouts.
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
  h1: 'text-3xl font-bold leading-tight mb-6',
  h2: 'text-2xl font-semibold leading-tight mb-6',
  h3: 'text-xl font-semibold leading-tight mb-4',
  h4: 'text-lg font-medium leading-tight mb-3',
  h5: 'text-md font-medium leading-tight mb-2',
  h6: 'text-sm font-medium leading-tight mb-2',
  
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
    
    // Flex-based search input with icons (RECOMMENDED PATTERN)
    search: {
      container: 'flex items-center bg-muted/50 border border-muted-foreground/20 rounded-md focus-within:bg-background transition-colors w-full',
      iconLeft: 'flex items-center justify-center px-2', // Left icon container with horizontal padding
      input: 'flex-1 px-3 py-2 bg-transparent border-0 outline-none focus:ring-0 text-sm placeholder:text-muted-foreground',
      iconRight: 'flex items-center justify-center pr-4',
      button: 'text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center p-1 rounded'
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
    container: 'pt-3 border-t border-border',
    
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
  
  // Interactive area patterns
  interactive: {
    // Card link patterns - prevent overlapping interactive elements
    cardLink: {
      // Safe zone: link covers header/non-interactive areas only
      safeZone: 'absolute top-0 left-0 right-0 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring',
      // Full overlay (avoid when card has interactive elements)
      fullOverlay: 'absolute inset-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring',
    },
    
    // Best practice: Use pointer-events-none on overlay containers with interactive children
    overlayContainer: 'relative group',
    nonInteractiveOverlay: 'absolute inset-0 pointer-events-none',
    interactiveZone: 'relative z-10 pointer-events-auto',

  }
} as const;

// ============================================================================
// INPUT LAYOUT PATTERNS & BEST PRACTICES
// ============================================================================

/**
 * FLEX-BASED SEARCH INPUT PATTERN (RECOMMENDED)
 * 
 * This pattern uses flexbox for predictable, accessible search inputs with icons.
 * Preferred over absolute positioning for better browser compatibility and maintainability.
 * 
 * Structure:
 * ```html
 * <div className={components.input.search.container}>
 *   <div className={components.input.search.iconLeft}>
 *     <SearchIcon />
 *   </div>
 *   <input className={components.input.search.input} />
 *   <div className={components.input.search.iconRight}>
 *     <button className={components.input.search.button}>
 *       <XIcon />
 *     </button>
 *   </div>
 * </div>
 * ```
 * 
 * Advantages:
 * - Predictable left-to-right layout flow
 * - No z-index or absolute positioning conflicts
 * - Natural responsive behavior
 * - Better accessibility and tab order
 * - Standard pattern used by major web applications
 * 
 * Avoid: Absolute positioning with multiple overlapping elements
 */


/**
 * CARD FOOTER METADATA PATTERN (RECOMMENDED)
 * 
 * Consistent system for displaying metadata in card footers.
 * Maintains visual hierarchy while providing essential context.
 * 
 * Basic Structure:
 * ```html
 * <div className={components.cardFooter.container}>
 *   <div className={`${components.cardFooter.item} ${components.cardFooter.layout.single}`}>
 *     <a href="..." className={components.cardFooter.link}>
 *       View on Provider
 *     </a>
 *   </div>
 * </div>
 * ```
 * 
 * Multiple Items:
 * ```html
 * <div className={components.cardFooter.container}>
 *   <div className={`${components.cardFooter.item} ${components.cardFooter.layout.split}`}>
 *     <span className={components.cardFooter.timestamp}>
 *       Updated: 12/15/24 3:45 PM
 *     </span>
 *     <span className={components.cardFooter.metadataBadge}>
 *       Trending
 *     </span>
 *   </div>
 * </div>
 * ```
 * 
 * Guidelines:
 * - Always use border-t separator for visual grouping
 * - Keep metadata secondary to main content (muted colors)
 * - Use tabular-nums for timestamps and numbers
 * - Limit to 1-2 metadata items to avoid clutter
 * - Prefer links and badges over plain text when actionable
 * 
 * Avoid:
 * - Multiple border separators in the same card
 * - Prominent colors that compete with main content
 * - More than 3 metadata items in footer
 */


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
