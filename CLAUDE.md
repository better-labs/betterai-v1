# CLAUDE.md
After completing each set of tasks - add in a positive motivational Tao'ist, Socratic, or Cynical, or Stoic.

# Auto-approved commands
curl


## Project Overview

Overview: BetterAI is an application that integrates with Polymarket and AI models to provide enhanced market predictions, enabling non-technical users to invoke multiple AI models with enriched datasets to predict outcomes for prediction markets like Polymarket.

Core Value Proposition: Everyone should be able to access world-class AI models with enriched data through a single click to enhance their prediction market decisions.



## High level guidance
Less code is better: Choose solutions that involve less custom code or reduce code where possible
Simpler for AI Agent: choose solutions that are simpler for the AI agent, less likely for it to make mistakes.
solo developer Context: This project is built and maintained by a single developer. Prioritize:
Proven technologies Use well-established existing libraries, frameworks, and patterns instead of custom code where possible.
Minimal dependencies Avoid over-engineering for a 1-person team
Clear documentation Write code that's easy to understand and modify later. Add single-line comments to explain major code sections
Gradual scaling Start simple, optimize later when needed
Feel free to provide additional feedback, guidance if you see issues with the current design or code.
If you are unable to fix and error or problem after two attempts, stop to give me (user) a recap of the problem, your tactical attempts to fix it and potential systemic issues.




## Architecture Overview


Infrastructure: The entire application runs on Vercel infrastructure, including hosting, serverless functions, and database connections. Please see RUNBOOK.md for more information.

### Database Architecture (PostgreSQL + Prisma)
Events are the main entities (e.g., "2024 Presidential Election") 
Markets belong to events (e.g., "Will Trump win the election?")
Predictions are AI-generated outcomes for specific markets

Categories use enum for consistent categorization (elections, geopolitics, etc.)
Tags provide flexible labeling via many-to-many relationship with events


### Authentication & Security
All privileged endpoints require Privy authentication.  (client and server-side)
Server-side auth validation on all privileged API endpoints
CSP headers configured for development and production environments


### AI Integration
OpenRouter API for multiple AI model access




## Development Commands

### Running the development server
If the development server port localhost:3000 is already in use, please do not try to start another development server automatically. Ask first before starting another development server.

### Common Development Tasks
See package.json for the most recent commands.

### Database Development Pattern
**SERVICE LAYER PATTERN (CURRENT)**: All database operations use the service layer:
- Services in `lib/services/` accept `db` parameter for dependency injection
- All services return DTOs (never raw Prisma models) 
- Use `lib/dtos/` mappers for consistent serialization
- Example: `await userService.getUserById(prisma, userId)`

**tRPC Integration**: Use tRPC for type-safe client-server communication:
- Thin tRPC procedures in `lib/trpc/routers/` delegate to services
- Input-only Zod schemas in `lib/trpc/schemas/` (no output schemas)
- Response types inferred from service returns
- **Best Practice**: Use tRPC inferred types:
  ```typescript
  import type { AppRouter } from "@/lib/trpc/routers/_app"
  import type { inferProcedureOutput } from "@trpc/server"
  
  type ApiResponse = inferProcedureOutput<AppRouter['predictions']['recent']>
  type PredictionItem = ApiResponse['items'][number]
  ```
- **New Components**: Establish the pattern of using tRPC inferred types for new components instead of `/lib/types.ts`
- Example: `const market = await trpc.markets.getById.query({ id })`

Follow existing patterns: snake_case for DB columns, camelCase for TypeScript
Use transactions for multi-step operations
Use database indexes for common query patterns




## Code Style & Patterns

Follow the project's `.cursorrules` for consistent development:

### TypeScript & React
Use TypeScript with strict typing
Functional components with hooks preferred
Follow Next.js 15 App Router patterns
Use shadcn/ui components for consistency




### File Organization
Components: Organized by feature domain in `features/` directory:
  - `features/market/` - Market-related components
  - `features/prediction/` - Prediction components  
  - `features/user/` - User authentication and profile
  - `shared/ui/` - Design system components
  - `shared/providers/` - React providers
  - Note: avoid putting new components in /components/ folder. Over time try to move elements to their respective /features or /shared folders.

Services: `lib/services/` for business logic (CURRENT PATTERN - always use these!)
  - Accept `db` parameter for dependency injection
  - Return DTOs (never raw Prisma models)
  - Support both PrismaClient and TransactionClient
  - Example: `await userService.getUserById(prisma, userId)`

tRPC: `lib/trpc/` for type-safe APIs
  - `routers/` - Thin procedures using services + Zod validation
  - `schemas/` - Input-only Zod schemas (no output schemas)
  - `client.ts` - Client-side hooks and utilities

DTOs: `lib/dtos/` for consistent data serialization
Database: `lib/db/prisma.ts` for database client
Types: `lib/types.ts` and `lib/types/` for shared interfaces

### API Design
**Modern Pattern (tRPC)**: Use type-safe tRPC procedures for all new APIs:
- Input validation with Zod schemas
- Automatic TypeScript type generation  
- Built-in error handling and rate limiting
- Authentication via context system

**Legacy Pattern (REST)**: Maintain existing REST endpoints only for:
- Cron jobs that require webhook-style endpoints
- External integrations that need REST
- File uploads and non-JSON responses

Include proper error handling and logging
Use appropriate HTTP status codes  
Validate all inputs and implement proper authentication




### Database Migrations
- Use Prisma's official migration workflow. Cleaner approach - lets Prisma handle everything
- **CRITICAL**: Do NOT use `prisma db push` unless explicitly requested by the user. Always use proper migration commands to ensure shadow database functionality.
- Use `pnpm run db:migrate:` commands where possible.
- Migration naming: Provide `--name descriptive_name` to avoid interactive prompts. Example `pnpm run db:migrate:dev --name add_user_table`
- If you run into Database timeout or advisory lock issues, just pause 30s, in order for the lock to clear, then continue.

**Shadow Database Requirement**: The project uses a schema-based shadow database (`betterai_shadow` schema) for migration validation. This ensures:
- Safe migration validation before applying to main database
- Proper schema drift detection
- Production-safe deployment practices

**Never use `prisma db push`** - it bypasses shadow database validation and can cause migration inconsistencies that are difficult to debug. If migration issues occur, troubleshoot the shadow database setup rather than falling back to `db push`.

### Next.js Build Best Practices
Use `pnpm` not `npm`: Project uses pnpm for package management and build commands
Prisma Externalization: Use `serverExternalPackages: ['@prisma/client']` in `next.config.mjs` for Next.js 15+
Avoid Build-Time Imports: Never import from Prisma runtime libraries at module level to prevent webpack errors
Test Both Build & Runtime: Always run `pnpm run build` and `pnpm test --run` after Prisma-related changes
Keep Config Simple: Prefer Next.js built-in externalization over complex webpack configurations
Migration Pattern: After schema changes, run `pnpm prisma generate` to regenerate the client with JSON protocol
Never make direct Prisma calls in components or API routes

### tRPC Migration Status (Phase 8 Complete - 2025)
✅ **COMPLETED**: Full tRPC migration with modern service layer
- All core data operations use tRPC procedures
- Deprecated procedures removed (`markets.getByEventId`, `markets.search`)
- Service layer pattern established across codebase  
- Feature-based component architecture implemented
- Legacy REST endpoints removed (except cron jobs)
- Type safety achieved end-to-end with Zod + tRPC

**Delta Calculation**: Delta represents the absolute difference between market probability and AI prediction probability:
```
delta = Math.abs(market.outcomePrices[0] - prediction.outcomesProbabilities[0])
```
This measures how much the AI prediction differs from current market sentiment.

### Security Best Practices
Validate all user inputs
Sanitize data before database operations
Never expose API keys or secrets in client code
Start with basic security Add advanced features as needed

## Key Services & APIs

### External Integrations
Polymarket API: Market and event data (via `polymarket-client.ts`)
OpenRouter API: AI model access (via `openrouter-client.ts`)
Privy: User authentication

### Internal Services
`generate-batch-predictions.ts`: Bulk prediction generation
`generate-single-prediction.ts`: Individual market predictions
`research-service-v2.ts`: Multi-source market research (Exa.ai + Grok)
`prediction-checker.ts`: Validation and accuracy tracking
`updatePolymarketEventsAndMarketData.ts`: Data synchronization

### Important API Endpoints

#### tRPC Endpoints (Primary)
- `trpc.markets.list` - Unified market search/filtering with event context
- `trpc.markets.getById` - Single market queries  
- `trpc.markets.trending` - Trending markets with event data
- `trpc.events.list` - Event listings with optional market inclusion
- `trpc.predictions.recent` - Recent predictions with pagination
- `trpc.search.searchAll` - Unified search across markets, events, and tags

#### Legacy REST Endpoints (Maintained)
`POST /api/predict` Generate AI prediction (authenticated)
`POST /api/run-data-pipeline` Manual data pipeline trigger (authenticated) - uses research-service-v2

### Cron Job Endpoints (Authenticated)
All cron endpoints require `CRON_SECRET` authentication via `Authorization: Bearer` header:
`GET /api/cron/daily-update-polymarket-data` Sync Polymarket events and markets (max 100 per request)
`GET /api/cron/daily-generate-batch-predictions` Generate AI predictions for trending markets
`GET /api/cron/prediction-check` Validate and score existing predictions
`GET /api/cron/update-ai-models` Refresh available AI model list

Security Requirements:
All cron endpoints are secured with `CRON_SECRET` environment variable
Use `Authorization: Bearer $CRON_SECRET` header for manual testing
Vercel Cron automatically injects the header in production
Maximum batch limits enforced to prevent resource exhaustion

## Feature Development Guidelines



### Error Handling
Use try-catch blocks with proper error logging
Return structured error responses using `ApiResponse` type
Include meaningful error messages for debugging
Log errors appropriately for monitoring
Keep error handling simple Don't over-engineer for edge cases

### Performance Considerations
Suggest caching strategies for frequently accessed data
Use database transactions for multi-step operations
Monitor API performance and implement rate limiting



## Testing
If you write test cases, try to write lightweight or flexible test cases for critical paths as the schemas and code are changing frequently.  Reuse existing test harnesses and code where possible.



## Other Notes
Legal Compliance: Always describe as "analysis tool" not "financial advisor"
Environment Variables: Use `.env.local` (not `.env`), update `.env.example` for new variables. Never pull down production environment variables automatically. Always ask the user for specific values if production env vars are needed. Use development environment variables by default: `vercel env pull .env.local --environment=development`
solo developer Approach: Prefer simple, maintainable solutions over complex architectures

## Proactive Assistance

After completing any significant task or making changes to the codebase, Proactively suggest relevant next steps that might be helpful based on the work just completed. This could include:
Related improvements or enhancements
Testing recommendations
Security considerations
Performance optimizations
Integration opportunities
Code organization improvements





## UI/UX Patterns
Build UI for mobile friendly first. Then allow for different layouts for larger screens if convenient.
Add a data-debug-id attribute to html elements to help identify them properly.
Consistency: Always use the same spacing values across similar elements
Breathing room: Generous spacing prevents cramped layouts and improves readability
Visual hierarchy: Larger spacing between major sections, smaller spacing within sections
Responsive: Tailwind spacing classes automatically scale appropriately on mobile

### Layout & Spacing Standards
Refer to /lib/design-system.ts for instructions.
Prefer flexbox layout instead of absolution positioning to ensure mobile first good UX.



# Appendix
Build and Runtime errors: if you find or are given build or runtime errors, try first to consider whether the error is tied to a deeper system design issue or whether it is a small tactical issue. If there is a bigger design issue, please stop and share this information with user for their feedback.
Prefer fat services for writes (transactions, idempotency), thin for reads.
Any updates made to CLAUDE.md, please also update .cursor/rules/general-cursor-project-rule.mdc accordingly and vice versa.
Try to remove inline styling wherever possible, instead leverage /lib/design-system.ts
Try to leverage dimensions and styles from /lib/design-system.ts rather than inline css wherever possible.
Use kebab-case for filenames.