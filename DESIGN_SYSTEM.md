# Design System Documentation

This document provides comprehensive guidance for using the BetterAI design system tokens and patterns.

## Overview

The design system provides consistent spacing, typography, and layout patterns used throughout the application for professional, polished layouts. All tokens are centralized in `lib/design-system.ts` for easy maintenance and consistency.

## Spacing System

### Major Section Spacing
- `spacing.section`: `mb-24` (6rem/96px) - between major sections
- `spacing.hero`: `py-16 mb-24` (4rem/64px vertical padding, 6rem/96px bottom margin)
- `spacing.divider`: `my-16` (4rem/64px) - for border separators

### Content Spacing
- `spacing.content`: `mb-12` (3rem/48px) - between content areas within sections
- `spacing.cta`: `mt-8` (2rem/32px) - top margin for secondary actions

### Typography Spacing
- `spacing.heading`: `mb-6` (1.5rem/24px) - bottom margin for headings

### Component Spacing
- `spacing.card`: `p-6` (1.5rem/24px) - padding for cards
- `spacing.button`: `px-4 py-2` (1rem/16px horizontal, 0.5rem/8px vertical)
- `spacing.input`: `px-3 py-2` (0.75rem/12px horizontal, 0.5rem/8px vertical)

## Layout Patterns

### Page Structure
```typescript
layout.page.container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
layout.page.section: spacing.section
layout.page.hero: spacing.hero
```

### Grid Systems
```typescript
// Responsive columns
layout.grid.cols: {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 md:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

// Grid gaps
layout.grid.gap: {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
}
```

## Interaction Tokens

### Touch Target Sizes (WCAG Compliant)
- `interaction.touchTarget.minimum`: `w-10 h-10` (40px) - WCAG AA compliance
- `interaction.touchTarget.standard`: `w-11 h-11` (44px) - WCAG AAA compliance
- `interaction.touchTarget.enhanced`: `w-12 h-12` (48px) - complex interactive elements

### Interactive Container Widths
- `interaction.container.minWidth`: `w-11` (44px) - ensures proper flex layout
- `interaction.container.standard`: `w-10` (40px) - basic icon containers
- `interaction.container.compact`: `w-8` (32px) - minimal but functional

## Typography Scale

### Headings
```typescript
typography.h1: 'text-2xl md:text-3xl lg:text-4xl font-bold leading-tight'
typography.h2: 'text-xl md:text-2xl lg:text-3xl font-semibold leading-tight'
typography.h3: 'text-lg md:text-xl lg:text-2xl font-semibold leading-tight'
typography.h4: 'text-base md:text-lg lg:text-xl font-medium leading-tight'
```

### Body Text
```typescript
typography.body: 'text-[clamp(0.875rem,1.5vw,1rem)] leading-relaxed' // 14px-16px
typography.bodyLarge: 'text-[clamp(1rem,2vw,1.125rem)] leading-relaxed' // 16px-18px
typography.bodySmall: 'text-sm leading-relaxed'
```

### Special Text
```typescript
typography.caption: 'text-sm text-muted-foreground'
typography.label: 'text-sm font-medium'
```

## Component Patterns

### Cards
```typescript
components.card.base: 'bg-card border border-border rounded-lg shadow-sm'
components.card.hover: 'hover:shadow-md transition-shadow duration-200'
```

### Buttons
```typescript
components.button.base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

// Sizes
components.button.size: {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
}

// Variants
components.button.variant: {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
}
```

### Search Inputs (Flex-based Layout)
```typescript
components.input.search: {
  container: 'flex items-center bg-muted/50 border border-muted-foreground/20 rounded-md focus-within:bg-background transition-colors w-full',
  iconLeft: 'w-11 flex items-center justify-center text-muted-foreground px-2',
  input: 'flex-1 px-3 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground',
  iconRight: 'w-11 flex items-center justify-center text-muted-foreground px-2',
  button: 'h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
}
```

### Navigation Links
```typescript
components.navigation.link: {
  base: 'text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors',
  active: 'text-foreground font-medium',
  subtle: 'text-muted-foreground/70 hover:text-muted-foreground transition-colors',
}

components.navigation.viewAll: {
  base: 'text-sm text-primary hover:text-primary/80 font-medium transition-colors',
  muted: 'text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors',
  accessible: 'text-sm text-primary hover:text-primary/80 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
}
```

## Input Layout Best Practices

### Flex-based Search Input Pattern (Industry Standard)

This pattern uses flexbox with fixed-width icon containers for predictable, accessible search inputs.

**Structure:**
```html
<div className={components.input.search.container}>
  <div className={components.input.search.iconLeft}>
    <SearchIcon />
  </div>
  <input className={components.input.search.input} />
  <div className={components.input.search.iconRight}>
    <button className={components.input.search.button}>
      <XIcon />
    </button>
  </div>
</div>
```

**Advantages:**
- Fixed 44px icon containers ensure consistent spacing
- Predictable layout across all screen sizes and browsers
- No z-index or absolute positioning conflicts
- Better accessibility and tab order
- Industry standard used by Google, GitHub, and most modern web apps

**Spacing Standards:**
- Icon containers: 44px minimum width (WCAG AAA compliance)
- Input padding: 12px horizontal (px-3)
- Icon size: 16px (h-4)
- Additional padding: 8px horizontal (px-2) on icon containers

## Navigation Links Best Practices

### Clean Navigation Links (No Arrows/Chevrons)

Follow web accessibility standards and modern design principles with clean navigation links.

**"View All" Example:**
```html
<Link 
  href="/predictions" 
  className={components.navigation.viewAll.accessible}
>
  View all predictions
</Link>
```

**Guidelines:**
- NO arrows, chevrons, or decorative symbols on clickable links
- Use underline and color changes to indicate hover/focus states
- Maintain consistent spacing and typography hierarchy
- Include proper focus states for keyboard navigation
- Use semantic HTML elements (Link, <a>) for navigation

**Why No Arrows/Chevrons:**
- Creates visual noise and reduces clarity
- Not necessary for users to understand clickability
- Can interfere with text selection and accessibility
- Modern web design favors minimal, clean interfaces
- Hover and focus states provide sufficient interaction feedback

## Accessibility

### Focus Management
```typescript
accessibility.focus: {
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
  high: 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-primary',
  inset: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
  subtle: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-muted-foreground',
}
```

### Screen Reader Support
```typescript
accessibility.srOnly: 'sr-only'
accessibility.skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium'
```

## Animation System

### Durations
```typescript
animation.duration: {
  instant: 'duration-0',
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',
  slower: 'duration-700',
}
```

### Easing
```typescript
animation.easing: {
  linear: 'ease-linear',
  in: 'ease-in',
  out: 'ease-out',
  inOut: 'ease-in-out',
  spring: 'ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
  natural: 'ease-[cubic-bezier(0.4,0.0,0.2,1)]',
  sharp: 'ease-[cubic-bezier(0.4,0.0,0.6,1)]',
  emphasized: 'ease-[cubic-bezier(0.2,0.0,0,1)]',
}
```

## Utility Functions

### Combine Spacing Classes
```typescript
combineSpacing(...classes: string[]): string
```

### Responsive Spacing
```typescript
getResponsiveSpacing(mobile: string, tablet?: string, desktop?: string): string
```

## Usage Examples

### Basic Card
```html
<div className={`${components.card.base} ${spacing.card}`}>
  <h3 className={`${typography.h3} ${spacing.heading}`}>Card Title</h3>
  <p className={typography.body}>Card content goes here.</p>
</div>
```

### Search Input
```html
<div className={components.input.search.container}>
  <div className={components.input.search.iconLeft}>
    <Search className="h-4 w-4" />
  </div>
  <input 
    className={components.input.search.input}
    placeholder="Search markets..."
  />
</div>
```

### Button with Focus States
```html
<button className={`${components.button.base} ${components.button.size.md} ${components.button.variant.primary}`}>
  Predict with AI
</button>
```

## Best Practices

1. **Consistency**: Always use design system tokens instead of hardcoded values
2. **Accessibility**: Include proper focus states and touch targets
3. **Mobile First**: Design for mobile, then enhance for larger screens
4. **Semantic HTML**: Use appropriate HTML elements for better accessibility
5. **Performance**: Prefer CSS classes over inline styles
6. **Maintainability**: Keep the design system centralized and well-documented
