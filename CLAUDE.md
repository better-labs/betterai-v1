# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BetterAI is a Next.js 15 prediction market application that integrates with Polymarket and AI models to provide enhanced market predictions. The app enables non-technical users to invoke multiple AI models with enriched datasets to predict outcomes for prediction markets like Polymarket.

**Core Value Proposition**: Everyone should be able to access world-class AI models with enriched data through a single click to enhance their prediction market decisions.

**Key Files for Context**:
- Read `TODO.md` for current implementation tasks and project goals
- Read `docs/DESIGN.md` for detailed product vision and user experience design
- Read `docs/DATA-STRUCTURES.md` for understanding the data relationships

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

### Common Development Tasks
```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build application (includes Prisma generate)
pnpm start                  # Start production server

# Testing
pnpm test                   # Run Vitest tests
pnpm test:ui                # Run tests with UI

# Database Operations
pnpm db:prisma:generate        # Generate Prisma client
pnpm db:prisma:studio          # Open Prisma Studio

pnpm db:migrate:deploy     # Deploy migrations to dev database

pnpm db:seed:dev           # Seed development database with full pipeline

# Linting
pnpm lint                  # Next.js ESLint

# CRON Jobs (Background Tasks)
pnpm cron:daily-update-polymarket-data      # Update market data from Polymarket
pnpm cron:daily-generate-batch-predictions  # Generate predictions for markets
pnpm cron:prediction-check                  # Check prediction accuracy
pnpm cron:update-ai-models                  # Update available AI models
```

### Database Development Pattern
- Use query functions from `lib/db/queries.ts` for all database operations
- Add new queries to appropriate query object (e.g., `marketQueries`, `eventQueries`)
- Follow existing patterns: snake_case for DB columns, camelCase for TypeScript
- Use transactions for multi-step operations
- Store raw API responses in separate `_raw` tables with metadata

### Testing
Run single test file:
```bash
pnpm test path/to/test/file.test.ts
```

## Code Style & Patterns

Follow the project's `.cursorrules` for consistent development:

### TypeScript & React
- Use TypeScript with strict typing
- Functional components with hooks preferred
- Follow Next.js 15 App Router patterns
- Use shadcn/ui components for consistency

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

### Database Guidelines
- Always use Prisma queries from `lib/db/queries.ts`
- Never make direct Prisma calls in components or API routes
- Use database indexes for common query patterns
- Clean up old raw data periodically
- Store raw API responses with metadata (marketId, eventId, apiEndpoint, responseStatus, fetchedAt)

### Security Best Practices
- Validate all user inputs
- Use environment variables for sensitive data (in `.env.local`, not `.env`)
- Implement proper authentication for cron jobs
- Sanitize data before database operations
- Never expose API keys or secrets in client code

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

### Performance Considerations
- Implement caching strategies for frequently accessed data
- Use database transactions for multi-step operations
- Process large datasets in chunks (see `upsertEvents` pattern)
- Monitor API performance and implement rate limiting

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
- **Environment Strategy**: Use `.env.local` (not `.env`), update `.env.example` for new variables
- **Documentation**: Add single-line comments to explain major code sections

## Proactive Assistance

After completing any significant task or making changes to the codebase, Claude should proactively suggest relevant next steps that might be helpful based on the work just completed. This could include:
- Related improvements or enhancements
- Testing recommendations
- Documentation updates needed
- Security considerations
- Performance optimizations
- Integration opportunities
- Code organization improvements

These suggestions should be tailored to the specific context of what was just accomplished and aligned with the project's current development phase and goals outlined in `TODO.md`.

# Claude Code Configuration

## Development Server

When running the development server, prefer using port 3002 or higher to avoid conflicts:

```bash
npm run dev -- --port 3002
```

or

```bash
yarn dev --port 3002
```

This helps avoid port conflicts with other development servers that commonly use ports 3000 and 3001.

## Pull Request Guidelines

**IMPORTANT**: When creating pull requests, always prepend "(claude)" to the beginning of the PR title.

Examples:
- `(claude) Add popular tags to recent predictions component`
- `(claude) Implement user authentication with Privy`
- `(claude) Fix CSP configuration for Vercel deployments`

This helps identify PRs created by Claude Code instances for better project management and review workflows.