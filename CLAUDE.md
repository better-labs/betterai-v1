# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BetterAI is a Next.js 15 prediction market application built by a **solo founder**. The app integrates with Polymarket and AI models to provide enhanced market predictions, enabling non-technical users to invoke multiple AI models with enriched datasets to predict outcomes for prediction markets like Polymarket.

**Core Value Proposition**: Everyone should be able to access world-class AI models with enriched data through a single click to enhance their prediction market decisions.


## High level guidance to Claude on coding and design
**Solo Founder Context**: This project is built and maintained by a single developer. Prioritize:
- **Simplicity over complexity** - Choose straightforward solutions that are easy to maintain
- **Less code is better** - Choose solutions that involve less custom code where possible.
- **Proven technologies** - Use well-established libraries and patterns
- **Minimal dependencies** - Avoid over-engineering for a 1-person team
- **Clear documentation** - Write code that's easy to understand and modify later
- **Gradual scaling** - Start simple, optimize later when needed
- Prefer simpler solutions with minimal code and/or reducing code where possible.

**Key Files for Context**:
- Read `TODO.md` for current implementation tasks and project goals
- Read `system-docs/DESIGN.md` for detailed product vision and user experience design
- Read `system-docs/DATA-STRUCTURES.md` for understanding the data relationships

## Architecture Overview

### Database Architecture (PostgreSQL + Prisma)
- **Events** are the main entities (e.g., "2024 Presidential Election") 
- **Markets** belong to events (e.g., "Will Trump win the election?")
- **Predictions** are AI-generated outcomes for specific markets
- **Users** authenticate via Privy and have predictions and watchlists
- **Categories** use enum for consistent categorization (elections, geopolitics, etc.)
- **Tags** provide flexible labeling via many-to-many relationship with events

Key data relationships:
- Events → Markets (one-to-many)
- Markets → Predictions (one-to-many)
- Users → Predictions (one-to-many)
- Events ↔ Tags (many-to-many via EventTag)

### Authentication & Security
- Uses **Privy** for user authentication (client and server-side)
- Server-side auth validation on all privileged API endpoints
- CSP headers configured for development and production environments
- Environment variables in `.env.local` (never `.env`)

### AI Integration
- **OpenRouter** API for multiple AI model access
- **Multi-step prediction pipeline**:
  1. Fetch market data from database
  2. AI identifies valuable data sources for the market
  3. Market research service gathers web data
  4. Final AI synthesis with all context for prediction

## Development Commands

### Running the development server
- If the development server port localhost:3000 is already in use, please do not try to start another development server automatically. Ask first before starting another development server.

### Common Development Tasks
See package.json for the most recent commands.

### Database Development Pattern
- Use query functions from `lib/db/queries.ts` for all database operations. Avoid direct Prisma usage in /app/api and /lib/services/ directories.
- Add new queries to appropriate query object (e.g., `marketQueries`, `eventQueries`)
- Follow existing patterns: snake_case for DB columns, camelCase for TypeScript
- Use transactions for multi-step operations
- Store raw API responses in separate `_raw` tables with metadata

### Prisma & Serialization Best Practices
- **CRITICAL RULE**: **Always use `*Serialized` methods when passing data to Client Components**
  - ✅ `getMarketByIdSerialized()`, `getPredictionsByMarketIdSerialized()`, `getRecentByMarketSerialized()`
  - ❌ Never use raw query methods like `getMarketById()` for client component data
  - **Why**: Raw Prisma data contains Decimal objects that break React's server-to-client serialization
- **Prisma JSON Protocol**: Uses `jsonProtocol = "true"` in `schema.prisma` to return plain JSON objects instead of Decimal instances
- **Server-to-Client Serialization**: Use `serializeDecimals()` from `lib/serialization.ts` when passing Prisma data to Client Components
- **API Routes**: Always serialize Prisma responses using `serializeDecimals()` before returning JSON
- **Migration Pattern**: After schema changes, run `pnpm prisma generate` to regenerate the client with JSON protocol
- **Common Error**: `"Only plain objects can be passed to Client Components"` errors indicate missing serialization
- **Centralized Pattern**: Use `*Serialized` query wrappers instead of manual serialization calls - if a `*Serialized` method doesn't exist, create it
- **Type Safety**: Define DTO interfaces in `lib/types.ts` with JSON-safe types (numbers, ISO date strings) for client components
- **Build Safety**: Avoid importing from `@prisma/client/runtime/library` at build time - use runtime detection for Decimal objects


## Code Style & Patterns

Follow the project's `.cursorrules` for consistent development:

### TypeScript & React
- Use TypeScript with strict typing
- Functional components with hooks preferred
- Follow Next.js 15 App Router patterns
- Use shadcn/ui components for consistency
- **Keep it simple** - Avoid over-engineering for a solo founder project

### UI/UX Patterns
- **Collapsible Content with Gradient Fade**: For long text content that needs to be collapsed, use gradient fade effects to indicate there's more content below:
  ```jsx
  // Collapsed content with fade effect
  <div className={cn(
    "relative overflow-hidden",
    !expanded && "max-h-[5rem]"
  )}>
    {content}
    {!expanded && (
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
    )}
  </div>
  ```
- **Show More/Less Controls**: Use chevron icons (ChevronDown/ChevronUp) with descriptive text for expand/collapse actions
- **Consistent Collapsed Heights**: Match collapsed heights to related UI sections (e.g., prediction summary height)

### Layout & Spacing Standards
Follow these consistent spacing patterns for professional, polished layouts:

**Page Sections:**
- Use semantic `<section>` elements for major content areas
- **Section spacing**: `mb-24` (6rem/96px) between major sections
- **Hero sections**: `py-16` (4rem/64px) vertical padding, `mb-24` bottom margin
- **Section dividers**: `my-16` (4rem/64px) margin for border separators

**Content Spacing:**
- **Page titles (H1)**: `mb-6` (1.5rem/24px) bottom margin
- **Section titles (H2)**: `mb-6` (1.5rem/24px) bottom margin 
- **Content blocks**: `mb-12` (3rem/48px) between content areas within sections
- **Call-to-action elements**: `mt-8` (2rem/32px) top margin for secondary actions

**Container Structure:**
```jsx
// Standard page layout
<main className="container mx-auto px-4 py-8">
  <section className="py-16 mb-24"> {/* Hero */}
    <h1 className="mb-6">Page Title</h1>
    <p>Description</p>
  </section>
  
  <section className="mb-24"> {/* Content section */}
    <div className="text-center mb-12">
      <h2 className="mb-6">Section Title</h2>
      <p>Section description</p>
    </div>
    {/* Section content */}
  </section>
</main>
```

**Best Practices:**
- **Consistency**: Always use the same spacing values across similar elements
- **Breathing room**: Generous spacing prevents cramped layouts and improves readability
- **Visual hierarchy**: Larger spacing between major sections, smaller spacing within sections
- **Responsive**: Tailwind spacing classes automatically scale appropriately on mobile

### File Organization
- **Components**: `components/` (reusable) and `app/` (page-specific)
- **Services**: `lib/services/` for business logic
- **Database**: `lib/db/` for queries and schema
- **Types**: `lib/types.ts` for shared interfaces
- **Utils**: `lib/utils.ts` for helper functions

### API Design
- Use Next.js API routes in `app/api/`
- Return consistent `ApiResponse` format from `lib/types.ts`
- Include proper error handling and logging
- Use appropriate HTTP status codes
- Validate all inputs and implement proper authentication
- **Start simple** - Use basic patterns that are easy to debug and maintain

### Database Guidelines
- Always use Prisma queries from `lib/db/queries.ts`
- Never make direct Prisma calls in components or API routes
- Use database indexes for common query patterns
- Clean up old raw data periodically
- Store raw API responses with metadata (marketId, eventId, apiEndpoint, responseStatus, fetchedAt)
- **Prefer simple queries** - Complex joins can be hard to debug for a solo developer

### Database Migrations
- Use `pnpm run db:migrate:dev` for development migrations
- Use `pnpm run db:migrate:deploy:dev` for development deployments (requires `.env.local`)
- Use `pnpm run db:migrate:status:dev` to check migration status (requires `.env.local`)
- **Migration naming**: Provide `--name descriptive_name` to avoid interactive prompts
- **Example**: `pnpm run db:migrate:dev --name add_user_table`
- Always test migrations in development before deploying to production

#### CI/CD Migration Commands
**IMPORTANT**: GitHub Actions and CI/CD environments should use the `:ci` variants that don't require `.env.local`:
- Use `pnpm run db:migrate:deploy:ci` for production deployments in CI/CD
- Use `pnpm run db:migrate:status:ci` for migration status checks in CI/CD
- These commands expect `DATABASE_URL_UNPOOLED` to be set as an environment variable
- **Root Cause**: The regular migration commands use `dotenv -e .env.local` which fails in CI/CD environments where no `.env.local` file exists

### Next.js Build Best Practices
- **Use `pnpm` not `npm`**: Project uses pnpm for package management and build commands
- **Prisma Externalization**: Use `serverExternalPackages: ['@prisma/client']` in `next.config.mjs` for Next.js 15+
- **Avoid Build-Time Imports**: Never import from Prisma runtime libraries at module level to prevent webpack errors
- **Test Both Build & Runtime**: Always run `pnpm run build` and `pnpm test --run` after Prisma-related changes
- **Keep Config Simple**: Prefer Next.js built-in externalization over complex webpack configurations

### Security Best Practices
- Validate all user inputs
- Use environment variables for sensitive data (in `.env.local`, not `.env`)
- Implement proper authentication for cron jobs
- Sanitize data before database operations
- Never expose API keys or secrets in client code
- **Start with basic security** - Add advanced features as needed

## Key Services & APIs

### External Integrations
- **Polymarket API**: Market and event data (via `polymarket-client.ts`)
- **OpenRouter API**: AI model access (via `openrouter-client.ts`)
- **Privy**: User authentication

### Internal Services
- `generate-batch-predictions.ts`: Bulk prediction generation
- `generate-single-prediction.ts`: Individual market predictions
- `market-research-service.ts`: Web research for predictions
- `prediction-checker.ts`: Validation and accuracy tracking
- `updatePolymarketEventsAndMarketData.ts`: Data synchronization

### Important API Endpoints
- `GET /api/markets` - List markets with search/filtering
- `POST /api/predict` - Generate AI prediction (authenticated)
- `GET /api/predictions/recent` - Recent predictions (authenticated)
- `GET /api/events` - List events with markets
- `POST /api/run-data-pipeline` - Manual data pipeline trigger (authenticated)

### Cron Job Endpoints (Authenticated)
All cron endpoints require `CRON_SECRET` authentication via `Authorization: Bearer` header:
- `GET /api/cron/daily-update-polymarket-data` - Sync Polymarket events and markets (max 100 per request)
- `GET /api/cron/daily-generate-batch-predictions` - Generate AI predictions for trending markets
- `GET /api/cron/prediction-check` - Validate and score existing predictions
- `GET /api/cron/update-ai-models` - Refresh available AI model list

**Security Requirements:**
- All cron endpoints are secured with `CRON_SECRET` environment variable
- Use `Authorization: Bearer $CRON_SECRET` header for manual testing
- Vercel Cron automatically injects the header in production
- Maximum batch limits enforced to prevent resource exhaustion

## Feature Development Guidelines

### Authentication Requirements
All privileged endpoints require Privy authentication. Use server-side auth validation:
```typescript
const user = await getUser(request)
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Error Handling
- Use try-catch blocks with proper error logging
- Return structured error responses using `ApiResponse` type
- Include meaningful error messages for debugging
- Log errors appropriately for monitoring
- **Keep error handling simple** - Don't over-engineer for edge cases

### Server→Client Data Flow Validation
**MANDATORY**: Check for this pattern in all new server→client data flows to prevent Decimal serialization errors:

**✅ Correct Patterns:**
```typescript
// Server Component → Client Component
const market = await marketQueries.getMarketByIdSerialized(id)
return <ClientComponent market={market} />

// API Route
const data = await queries.getSomethingSerialized(id)
return NextResponse.json({ success: true, data })
```

**❌ Incorrect Patterns:**
```typescript
// Will cause "Only plain objects can be passed" error
const market = await marketQueries.getMarketById(id) // Raw Prisma data
return <ClientComponent market={market} />

// Missing serialization in API
const data = await prisma.model.findMany() // Raw Prisma data
return NextResponse.json({ success: true, data }) // Error at runtime
```

**Development Checklist:**
- [ ] Are you passing Prisma data to a Client Component? → Use `*Serialized` method
- [ ] Are you returning Prisma data from an API route? → Use `serializeDecimals()`
- [ ] Does the `*Serialized` method exist? → Create it if missing
- [ ] Are you importing Prisma in client components? → Move to server-side or API route

### Performance Considerations
- Implement caching strategies for frequently accessed data
- Use database transactions for multi-step operations
- Process large datasets in chunks (see `upsertEvents` pattern)
- Monitor API performance and implement rate limiting
- **Optimize when needed** - Don't pre-optimize for a solo founder project

## Current Development Focus

The project is currently in **Private Beta** phase focusing on:
1. **Watchlist & Portfolio Features**: User market bookmarking and tracking
2. **Credit System**: Free daily credits for new users (100 credits, reset daily)
3. **Security Hardening**: Rate limiting, authentication, and operational monitoring
4. **UI/UX Polish**: Loading states, error handling, responsive design

See `TODO.md` for detailed current implementation tasks and priorities.

## Important Notes

- **Legal Compliance**: Always describe as "analysis tool" not "financial advisor"
- **Rate Limiting**: Implement per-user quotas before public launch
- **Data Pipeline**: Multi-step AI-enhanced research process for predictions
- **Cron Jobs**: Automated daily tasks for data updates and batch predictions
- **Cron Authentication**: All cron endpoints require `Authorization: Bearer $CRON_SECRET` header
- **Environment Strategy**: Use `.env.local` (not `.env`), update `.env.example` for new variables
- **Documentation**: Add single-line comments to explain major code sections
- **Solo Founder Approach**: Prefer simple, maintainable solutions over complex architectures

## Proactive Assistance

After completing any significant task or making changes to the codebase, Claude should proactively suggest relevant next steps that might be helpful based on the work just completed. This could include:
- Related improvements or enhancements
- Testing recommendations
- Documentation updates needed
- Security considerations
- Performance optimizations
- Integration opportunities
- Code organization improvements

These suggestions should be tailored to the specific context of what was just accomplished and aligned with the project's current development phase and goals outlined in `TODO.md`. **Remember this is a solo founder project** - prioritize suggestions that are practical and maintainable for a 1-person team.

# Claude Code Configuration

### Running the development server
- If the development server port localhost:3000 is already in use, please do not try to start another development server automatically. Ask first before starting another development server.

## Pull Request Guidelines

**IMPORTANT**: When creating pull requests, always prepend "(claude)" to the beginning of the PR title.

Examples:
- `(claude) Add popular tags to recent predictions component`
- `(claude) Implement user authentication with Privy`
- `(claude) Fix CSP configuration for Vercel deployments`

This helps identify PRs created by Claude Code instances for better project management and review workflows.

# Appendix
- Feel free to throw in a quote from the movie the Big Lebowski or Forest Gump when relevant.
- Feel free to provide additional feedback, guidance if you see issues with the current design or code.
- If you're writing test cases, try to write lightweight or flexible test cases as the schemas and code are changing frequently.  Reuse existing test harnesses and code where possible.
- Prefer comprehensive solutions where possible.