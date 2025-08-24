# Component Organization Guide

## Modern Feature-Based Architecture

BetterAI follows **modern colocation principles** and **screaming architecture** patterns, organizing code by business domain rather than technical concerns. This approach reflects 2024-2025 industry best practices for scalable Next.js applications.

## Core Philosophy: "Screaming Architecture"

Your folder structure should **"scream" what your application does**, not what technologies you use.

- ❌ **Technical Focus**: `components/`, `hooks/`, `services/` (screams "I'm a React app!")
- ✅ **Business Focus**: `market/`, `prediction/`, `user/` (screams "I'm a prediction platform!")

## Directory Structure

```
src/
├── app/                         # Next.js App Router
│   ├── market/[id]/page.tsx
│   ├── prediction/[id]/page.tsx
│   └── layout.tsx
├── features/                    # Business domains (primary organization)
│   ├── market/
│   │   ├── MarketCard.tsx              # Server component (default)
│   │   ├── MarketCard.test.tsx         # Colocated tests
│   │   ├── MarketCard.stories.tsx      # Colocated stories
│   │   ├── MarketList.client.tsx       # Client component (explicit)
│   │   ├── MarketFilters.client.tsx    # Interactive client component
│   │   ├── useMarketData.ts           # Domain-specific hook
│   │   ├── marketUtils.ts             # Domain utilities
│   │   ├── types.ts                   # Feature types
│   │   └── _components/               # Private components (Next.js)
│   │       └── MarketCardSkeleton.tsx
│   ├── prediction/
│   │   ├── PredictionCard.tsx
│   │   ├── PredictionModal.client.tsx
│   │   ├── PredictionChart.client.tsx
│   │   ├── usePredictionState.ts
│   │   ├── predictionApi.ts
│   │   ├── types.ts
│   │   └── _services/                 # Private services
│   ├── user/
│   │   ├── UserProfile.tsx
│   │   ├── UserCredits.client.tsx
│   │   ├── useUserAuth.ts
│   │   └── types.ts
│   └── analytics/
│       ├── AnalyticsDashboard.tsx
│       ├── PerformanceChart.client.tsx
│       └── useAnalytics.ts
├── shared/                      # Only truly generic, reusable code
│   ├── ui/                      # Design system components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.module.css
│   │   ├── Card/
│   │   └── Modal/
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.client.tsx
│   ├── providers/               # React context providers
│   │   ├── AuthProvider.tsx
│   │   └── ThemeProvider.client.tsx
│   └── utils/                   # Pure utilities
│       ├── formatters.ts
│       ├── validation.ts
│       └── constants.ts
└── lib/                         # External integrations & configuration
    ├── db/
    ├── services/
    └── utils.ts
```

## Naming Conventions & File Colocation

### Component Naming
- **Server Components**: `ComponentName.tsx` (Next.js default)
- **Client Components**: `ComponentName.client.tsx` (explicit interactivity)
- **Test Files**: `ComponentName.test.tsx` (colocated with source)
- **Stories**: `ComponentName.stories.tsx` (colocated documentation)
- **Styles**: `ComponentName.module.css` (colocated styles)

### Folder Conventions
- **Private Folders**: `_components/`, `_services/` (Next.js convention - not routable)
- **Feature Folders**: Flat structure (max 2-3 levels deep)
- **Domain Grouping**: Organize by business capability, not file type

## The Colocation Principle

**"Keep files that often change together close to each other"** - Kent C. Dodds

### Benefits of Colocation:
✅ **Faster Navigation** - No scavenger hunt across directories  
✅ **Easier Refactoring** - Move entire features as units  
✅ **Better Mental Model** - One folder = one business capability  
✅ **Reduced Cognitive Load** - Less context switching  
✅ **Team Scalability** - Clear ownership boundaries

### Example of Perfect Colocation:
```
features/market/
├── MarketCard.tsx              # Component
├── MarketCard.test.tsx         # Tests
├── MarketCard.stories.tsx      # Documentation  
├── MarketCard.module.css       # Styles
├── useMarketData.ts           # Related hook
├── marketUtils.ts             # Domain utilities
└── types.ts                   # Feature types
```

## Feature vs Shared Decision Matrix

### Use `features/[domain]/` when:
- ✅ Component is specific to a business domain
- ✅ Logic contains business rules
- ✅ Used primarily within one feature area
- ✅ Changes frequently with feature requirements

### Use `shared/` when:
- ✅ Component is truly generic (Button, Modal, Input)
- ✅ No business logic or domain knowledge
- ✅ Used across multiple features
- ✅ Changes infrequently (design system components)

## ESLint Rules for Architecture Enforcement

Our configuration enforces modern patterns:

```javascript
// Prevent Prisma in client components (Next.js best practice)
"*.client.tsx": {
  "no-restricted-imports": ["@prisma/client", "@/lib/db/*"]
}

// Encourage feature colocation
"features/**/*": {
  "prefer-local-imports": true // Custom rule
}

// Keep shared components pure
"shared/**/*": {
  "no-restricted-imports": ["@/features/*"]
}
```

## Domain Organization Examples

### Market Domain (Trading Focus)
```
features/market/
├── MarketCard.tsx                    # Display market info
├── MarketList.client.tsx            # Interactive list with filters
├── MarketFilters.client.tsx         # Filter controls
├── MarketChart.client.tsx           # Price/volume charts
├── useMarketData.ts                 # Data fetching hook
├── useMarketFilters.ts             # Filter state management
├── marketCalculations.ts           # Business logic
├── marketValidation.ts             # Domain validation
├── types.ts                        # Market-specific types
└── _components/                    # Private components
    ├── MarketSkeleton.tsx
    └── MarketError.tsx
```

### Prediction Domain (AI/ML Focus)
```
features/prediction/
├── PredictionCard.tsx              # Display predictions
├── PredictionModal.client.tsx      # Create/edit modal
├── PredictionEngine.tsx            # Server-side AI integration
├── PredictionChart.client.tsx      # Interactive visualizations
├── PredictionHistory.client.tsx    # User prediction timeline
├── usePredictionEngine.ts          # AI model hook
├── usePredictionState.ts          # Modal/form state
├── predictionApi.ts               # API integration
├── predictionScoring.ts           # Accuracy calculations
├── types.ts                       # Prediction types
└── _services/
    ├── aiModelService.ts
    └── accuracyService.ts
```

### User Domain (Authentication/Profile Focus)
```
features/user/
├── UserProfile.tsx                 # Profile display
├── UserSettings.client.tsx         # Settings form
├── UserCredits.client.tsx         # Credits management
├── UserActivity.tsx               # Activity feed
├── useUserAuth.ts                 # Authentication hook  
├── useUserCredits.ts             # Credits hook
├── userValidation.ts             # Form validation
├── types.ts                      # User types
└── _components/
    ├── UserAvatar.tsx
    └── CreditsBadge.tsx
```

## Migration Benefits

### Immediate Advantages:
🚀 **Developer Experience** - Find related code instantly  
🧠 **Mental Model** - Structure matches business thinking  
🔧 **Maintainability** - Change features without breaking others  
📈 **Scalability** - Add features without restructuring  
👥 **Team Onboarding** - Industry-standard organization

### Long-term Benefits:
- **Framework Agnostic** - Business logic separate from React concerns
- **Microservice Ready** - Features can extract to services
- **Domain Expert Friendly** - Non-developers can navigate codebase
- **Testing Strategy** - Unit tests colocated, integration tests by domain

## Best Practices & Patterns

### 1. Keep It Flat (2-3 levels max)
```
✅ Good: features/market/MarketCard.tsx
❌ Bad:  features/market/components/cards/market/MarketCard.tsx
```

### 2. Use Next.js Private Folders
```
features/market/
├── MarketCard.tsx        # Public API
└── _components/          # Private internals
    └── MarketSkeleton.tsx
```

### 3. Colocate Everything Related
```
features/market/
├── MarketCard.tsx
├── MarketCard.test.tsx   # ← Tests next to source
├── MarketCard.stories.tsx # ← Documentation next to source
└── useMarketData.ts      # ← Hooks next to consumers
```

### 4. Domain-Specific Utilities
```
// ✅ Good - Domain-specific
features/market/marketCalculations.ts

// ❌ Bad - Generic placement  
shared/utils/calculations.ts (when only used for markets)
```

This organization reflects modern React/Next.js best practices and ensures your codebase "screams" that it's a prediction market platform, not just another React application.