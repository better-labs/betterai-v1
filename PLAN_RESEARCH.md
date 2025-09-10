# Research Integration System Specification

## Current Session Status (Sep 10, 2025)

### ✅ Completed in This Session
1. **Database Schema** - Implemented many-to-many architecture via PredictionSessionResearchCache junction table
2. **Research Service V2** - Complete implementation at `lib/services/research/research-service-v2.ts`
   - Exa.ai integration with smart domain selection (sports vs. news)
   - Grok X/Twitter integration via OpenRouter (x-ai/grok-4 model)
   - 12-hour cache duration with efficient read path
   - Refactored cache check into reusable helper function
3. **Session Worker Integration** - Added RESEARCHING phase with junction table linkage
4. **Environment Configuration** - Both EXA_API_KEY and OPENROUTER_API_KEY working
5. **Test Script Enhancement** - `scripts/test-research-integrations.ts` now:
   - Tests multiple markets (588667, 591762, and trending)
   - Tracks results in arrays with comprehensive summary
   - Loads .env.local automatically
   - Shows detailed performance metrics

### 🔧 Key Fixes Applied
- Fixed Exa.ai sports search by removing domain restrictions for sports markets
- Extended search window from 7 to 14 days for better results
- Fixed TypeScript issues with proper type annotations
- Renamed service from `enhanced-research-service.ts` to `research-service-v2.ts`
- Fixed database permissions via role provisioning script

### 📊 Test Results Summary
All 3 test markets working successfully:
- **Trump/WTC Market (588667)** - Political content working
- **SpaceX Starship (591762)** - Tech/Space content working  
- **Commanders vs. Packers (589788)** - Sports content working with improved results

Exa.ai now returns relevant betting odds and predictions (Vegas Insider, Covers.com)
Grok provides real-time social sentiment with key accounts and percentages

### 🚀 Next TODOs (Priority Order)
1. **Write vitests for research service integrations** (Started but not completed)
   - Mock Exa.ai API responses
   - Mock Grok/OpenRouter responses
   - Test cache functionality
   - Test error handling

2. **Create Radio Group UI Component**
   - Build `shared/ui/radio-group.tsx` from existing patterns
   - Follow design system conventions

3. **Create Research Source Selection Card**
   - Build `features/prediction/research-source-selection-card.client.tsx`
   - Integrate with radio group component
   - Show credit costs per source

4. **Update Prediction Generator**
   - Create `prediction-generator-v2.client.tsx` (copy from existing)
   - Add research source selection
   - Pass research context to predictions

5. **Update tRPC Schemas and Routers**
   - Add `selectedResearchSource` to StartPredictionSessionInput
   - Update session creation to include research source
   - Calculate total cost including research

### 💡 Important Notes for Next Session
- Cache duration is now 12 hours (not 1 hour)
- Use `performMarketResearchV2()` not `performEnhancedMarketResearch()`
- Test script at `scripts/test-research-integrations.ts` is fully functional
- Database has proper permissions after role provisioning fix
- Exa.ai works best without domain restrictions for sports markets

### 🐛 Known Issues
- None currently blocking progress

## Overview

This document outlines the enhanced market research system for BetterAI's prediction pipeline. The system enables users to select from multiple research sources (Exa.ai, Grok, Google/Bing) during prediction setup, with research results cached and shared across all selected AI models in a session.

## User Requirements

- **Research Source Selection**: During initial prediction setup alongside AI model selection
- **Research Scope**: Per-session (one research phase for all selected models), results reused across predictions  
- **Research Sources Priority**: Phase 1: Exa.ai & X (Twitter) via Grok AI, Phase 2: Google/Bing APIs
- **UI Flow**: Radio button selection (single choice) similar to current AI model selection with cost display
- **Architecture Choice**: Enhanced Session Flow (selected for easy implementation + maximum flexibility)

## System Architecture


**Key Benefits:**
- Extends current `prediction-session-worker.ts` flow
- Leverages existing `RESEARCHING` status in Prisma schema  
- Single research phase per session, shared across all models
- Clean separation enables future per-model research without breaking changes
- Radio button constraint (single selection) fits naturally with session-based research

## Phase 1 Implementation: Exa.ai Integration

### Database Schema Changes

**Key Architecture Decision**: Many-to-many relationship via junction table for maximum flexibility

```prisma
model PredictionSession {
  id              String                              @id @default(cuid())
  userId          String                              @map("user_id")
  marketId        String                              @map("market_id")
  selectedModels  String[]                            @map("selected_models")
  status          PredictionSessionStatus             @default(INITIALIZING)
  step            String?
  error           String?
  createdAt       DateTime                            @default(now()) @map("created_at")
  completedAt     DateTime?                           @map("completed_at")
  researchCache   PredictionSessionResearchCache[]    // NEW: Many-to-many relationship
  
  // ... existing relations
}

model ResearchCache {
  id                 Int                              @id @default(autoincrement())
  marketId           String?                          @map("market_id")
  source             String                           @map("source") // NEW: "exa", "grok", "google", "bing"
  modelName          String                           @map("model_name") // Keep for backward compatibility
  systemMessage      String?                          @map("system_message")
  userMessage        String                           @map("user_message")
  response           Json?
  createdAt          DateTime?                        @default(now()) @map("created_at")
  market             Market?                          @relation(fields: [marketId], references: [id])
  predictionSessions PredictionSessionResearchCache[] // NEW: Many-to-many relationship
}

// NEW: Junction table enabling flexible research relationships
model PredictionSessionResearchCache {
  id                  String            @id @default(cuid())
  predictionSessionId String            @map("prediction_session_id")
  researchCacheId     Int               @map("research_cache_id")
  usedInGeneration    Boolean           @default(true) @map("used_in_generation") // Was this research actually used?
  createdAt           DateTime          @default(now()) @map("created_at")
  
  predictionSession   PredictionSession @relation(fields: [predictionSessionId], references: [id], onDelete: Cascade)
  researchCache       ResearchCache     @relation(fields: [researchCacheId], references: [id], onDelete: Cascade)

  @@unique([predictionSessionId, researchCacheId])
  @@map("prediction_session_research_cache")
}
```

**Benefits of Many-to-Many Architecture**:
- **Future Multi-Source Support**: Sessions can use multiple research sources (Exa + Grok)
- **Research Reuse**: Same research cached across multiple user sessions  
- **Session Independence**: Sessions remain independent of research availability
- **Research Analytics**: Track which research sources improve prediction accuracy
- **Quality Control**: `usedInGeneration` flag tracks actual research usage vs availability

### Environment Variables

Required environment variables for research sources:

```bash
# Research Sources - API Keys
EXA_API_KEY=your-exa-api-key-here

# Existing OpenRouter configuration (used for Grok research)
OPENROUTER_API_KEY=sk-or-your-openrouter-api-key-here
```

### Research Source Configuration

```typescript
// lib/config/research-sources.ts
export const RESEARCH_SOURCES = [
  {
    id: 'exa',
    name: 'Exa.ai',
    description: 'Advanced web search optimized for recent developments',
    provider: 'Exa.ai',
    creditCost: 1, // Hiogher cost for premium semantic search
    available: true
  },
  {
    id: 'grok',
    name: 'X (Twitter)',
    description: 'X (Twitter) realtime market research via Grok AI',
    provider: 'Grok AI',
    creditCost: 2,
    available: true
  }
  // Phase 2 additions:
  // { id: 'google', name: 'Google Search API', ... }
  // { id: 'bing', name: 'Bing Search API', ... }
] as const
```

### UI Components Integration

#### Research Source Selection (Radio Button Pattern)

**IMPORTANT**: All UX enhancements must use v2 pages to avoid impacting production flow during deployment.

**Location**: `features/prediction/prediction-generator-v2.client.tsx` (NEW - Copy from existing)

```typescript
// Extends existing model selection with research source selection
export function PredictionGenerator({ marketId }: PredictionGeneratorProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedResearchSource, setSelectedResearchSource] = useState<string>('exa') // NEW - Default to Exa.ai
  
  // Total cost calculation includes research source cost
  const totalCost = selectedModels.reduce((cost, modelId) => {
    const model = AI_MODELS.find(m => m.id === modelId)
    return cost + (model?.creditCost || 0)
  }, 0) + getResearchSourceCost(selectedResearchSource) // NEW

  return (
    <div className="space-y-6">
      {/* Existing AI Model Selection */}
      <ModelSelectionCard />
      
      {/* NEW: Research Source Selection */}
      <ResearchSourceSelectionCard 
        selectedSource={selectedResearchSource}
        onSourceChange={setSelectedResearchSource}
      />
      
      {/* Updated Cost Summary */}
      <CostSummaryCard models={selectedModels} researchSource={selectedResearchSource} />
    </div>
  )
}
```

**Reusable Components**:
- `shared/ui/radio-group.tsx` - Create from existing toggle-group pattern
- Design system integration using `components.toggleAction` patterns
- Loading states via existing `shared/ui/loading.tsx`

#### Research Source Selection Card

**Non-Breaking Deployment Strategy:**
- Create `prediction-generator-v2` page alongside existing production page
- Test research integration thoroughly in v2 environment
- Once stable, gradually migrate production traffic or swap implementations
- Maintain backward compatibility with existing prediction flow

```typescript
// features/prediction/research-source-selection-card.client.tsx
import { components } from '@/lib/design-system'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { RESEARCH_SOURCES } from '@/lib/config/research-sources'

export function ResearchSourceSelectionCard({ 
  selectedSource, 
  onSourceChange 
}: ResearchSourceSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Research Source</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select how AI models will gather market research data
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedSource} onValueChange={onSourceChange}>
          {RESEARCH_SOURCES.map((source) => (
            <label
              key={source.id}
              className="flex items-start space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              data-debug-id={`research-source-${source.id}`}
            >
              <RadioGroupItem value={source.id} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <div className="font-medium text-sm">{source.name}</div>
                    <div className="text-xs text-muted-foreground">{source.provider}</div>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit">
                    {source.creditCost} credit{source.creditCost !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {source.description}
                </p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
```

### Service Layer Extensions

#### Enhanced Research Service

```typescript
// lib/services/research/research-service-v2.ts
import { RESEARCH_SOURCES } from '@/lib/config/research-sources'

export interface ResearchResult {
  source: string
  relevant_information: string
  links: string[]
  confidence_score?: number
  timestamp: Date
}

export async function performMarketResearchV2(
  marketId: string,
  researchSource: string,
  modelName?: string
): Promise<ResearchResult> {
  
  // Route to appropriate research implementation
  switch (researchSource) {
    case 'exa':
      return await performExaResearch(marketId, modelName)
    case 'grok':
      return await performGrokResearch(marketId, modelName)
    default:
      throw new Error(`Unsupported research source: ${researchSource}`)
  }
}

async function performExaResearch(marketId: string, modelName?: string): Promise<ResearchResult> {
  // Phase 1: Implement Exa.ai semantic search
  // 1. Get market data
  const market = await getMarketById(prisma, marketId)
  if (!market) throw new Error(`Market ${marketId} not found`)

  // 2. Construct semantic search query
  const searchQuery = `${market.question} ${market.description || ''} recent developments news`
  
  // 3. Call Exa.ai API
  const exaApiKey = process.env.EXA_API_KEY
  if (!exaApiKey) throw new Error('EXA_API_KEY environment variable not set')
  
  const exaResponse = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': exaApiKey
    },
    body: JSON.stringify({
      query: searchQuery,
      numResults: 10,
      includeDomains: ['reuters.com', 'bloomberg.com', 'cnn.com', 'bbc.com'],
      useAutoprompt: true
    })
  })
  
  // 4. Process and format results
  const exaData = await exaResponse.json()
  const relevant_information = exaData.results.map(r => r.text).join('\n')
  const links = exaData.results.map(r => r.url)
  
  // 5. Cache results via research-cache-service
  await createResearchCache(prisma, {
    marketId,
    source: 'exa',
    modelName: 'exa-search',
    systemMessage: 'Exa.ai semantic search',
    userMessage: searchQuery,
    response: { relevant_information, links }
  })

  return {
    source: 'exa',
    relevant_information,
    links,
    timestamp: new Date()
  }
}

async function performGrokResearch(marketId: string, modelName?: string): Promise<ResearchResult> {
  // Phase 1: Implement X (Twitter) realtime research via Grok AI
  // 1. Get market data
  const market = await getMarketById(prisma, marketId)
  if (!market) throw new Error(`Market ${marketId} not found`)

  // 2. Construct Twitter/X search query for realtime sentiment  
  const systemMessage = `You are a research assistant specialized in X (Twitter) analysis...`
  const userMessage = `Please search X (Twitter) for the latest information regarding: ${market.question}...`
  
  // 3. Call OpenRouter with x-ai/grok-4 model for X data analysis
  const grokModel = 'x-ai/grok-4' // Specific Grok 4 model for X/Twitter access
  const researchResult = await fetchStructuredFromOpenRouter<ResearchResult>(
    grokModel,
    systemMessage,
    userMessage,
    researchSchemaJson,
    researchZod,
    true // Enable X/Twitter search
  )
  
  // 4. Process and format results with social sentiment context
  // 5. Cache results via research-cache-service
  await createResearchCache(prisma, {
    marketId,
    source: 'grok',
    modelName: grokModel,
    systemMessage,
    userMessage,
    response: researchResult
  })

  return {
    source: 'grok',
    relevant_information: researchResult.relevant_information,
    links: researchResult.links,
    timestamp: new Date()
  }
}
```

#### Session Worker Integration

```typescript
// lib/services/prediction-session-worker.ts (Enhanced)
import { performMarketResearchV2 } from '@/lib/services/research/research-service-v2'

export async function executePredictionSession(
  db: DbClient,
  sessionId: string
): Promise<WorkerResult> {
  // ... existing setup ...

  // NEW: Research Phase
  await updatePredictionSession(db, sessionId, {
    status: 'RESEARCHING',
    step: 'Gathering market research data'
  })

  let researchResults: ResearchResult | null = null
  if (session.selectedResearchSource) {
    try {
      researchResults = await performMarketResearchV2(
        marketId,
        session.selectedResearchSource
      )
      
      // Store research results in session
      await updatePredictionSession(db, sessionId, {
        researchResults: researchResults
      })
    } catch (error) {
      console.error('Research failed, continuing without:', error)
    }
  }

  // Existing Generation Phase (enhanced with research context)
  await updatePredictionSession(db, sessionId, {
    status: 'GENERATING',
    step: 'Starting prediction generation with research data'
  })

  // Pass research results to prediction generation
  for (const modelName of selectedModels) {
    const result = await generatePredictionForMarket(
      marketId,
      userId,
      modelName,
      researchResults?.relevant_information, // NEW: Research context
      undefined,
      undefined
    )
    // ... existing logic ...
  }
}
```

### tRPC API Extensions

```typescript
// lib/trpc/schemas/prediction-session.ts (Enhanced)
export const StartPredictionSessionInput = z.object({
  marketId: z.string().min(1, 'Market ID is required'),
  selectedModels: z.array(z.string().min(1)).min(1).max(5),
  selectedResearchSource: z.string().optional(), // NEW
})

// lib/trpc/routers/prediction-sessions.ts (Enhanced)
export const predictionSessionsRouter = router({
  start: privateProcedure
    .input(StartPredictionSessionInput)
    .mutation(async ({ input, ctx }) => {
      const { marketId, selectedModels, selectedResearchSource } = input
      
      // Calculate total cost including research
      const totalCost = calculateSessionCost(selectedModels, selectedResearchSource)
      
      // ... existing credit validation ...
      
      const session = await predictionSessionService.createSession(ctx.db, {
        userId: ctx.user.id,
        marketId,
        selectedModels,
        selectedResearchSource, // NEW
        status: 'INITIALIZING'
      })
      
      // ... rest of implementation ...
    })
})
```

### Design System Extensions

**New Components Needed**:

```typescript
// shared/ui/radio-group.tsx
export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    className={cn("grid gap-2", className)}
    {...props}
    ref={ref}
  />
))

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <div className="h-3.5 w-3.5 rounded-full bg-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
))
```

**Design Token Extensions**:

```typescript
// lib/design-system.ts (additions)
export const components = {
  // ... existing components ...
  
  // Research source selection patterns
  researchSelection: {
    container: 'space-y-4',
    sourceOption: 'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors',
    sourceContent: 'flex-1 min-w-0',
    sourceHeader: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1',
    sourceName: 'font-medium text-sm',
    sourceProvider: 'text-xs text-muted-foreground',
    sourceDescription: 'text-xs text-muted-foreground mt-1',
    sourceCost: 'text-xs w-fit'
  },
  
  // Cost summary enhancements
  costBreakdown: {
    container: 'p-3 bg-muted rounded-lg space-y-2',
    row: 'flex justify-between items-center text-sm',
    label: 'text-muted-foreground',
    value: 'font-medium',
    total: 'border-t pt-2 mt-2 font-semibold'
  }
} as const
```

## Phase 2+ Expansion Plan

### Multi-Source Support (Already Enabled!)
The many-to-many architecture naturally supports multiple research sources per session:

```typescript
// Phase 2: Multiple sources per session (no schema changes needed!)
// UI simply creates multiple PredictionSessionResearchCache records
const sessionWithMultipleSources = {
  researchCache: [
    { researchCache: { source: 'exa', response: { ... } }, usedInGeneration: true },
    { researchCache: { source: 'grok', response: { ... } }, usedInGeneration: true }
  ]
}

// Phase 3: Advanced research configuration  
interface ResearchConfig {
  sources: string[]
  perModelOverrides?: Record<string, string[]>
  qualityThreshold?: number
  blendingStrategy?: 'combine' | 'best' | 'weighted'
}
```

### Advanced Research Features (Enabled by Junction Table)
- **Research Quality Scoring**: Track accuracy improvements per research source
- **Source Blending**: Intelligent combination of multiple research results
- **Per-Model Research**: Different research sources optimized for different AI models
- **Research Templates**: Pre-configured strategies based on market categories
- **Usage Analytics**: `usedInGeneration` flag enables A/B testing of research effectiveness
- **Research History**: Full audit trail of which research influenced which predictions

## Implementation Status

### Completed (Phase 1 Foundation)
✅ **Database Schema**: Many-to-many architecture via PredictionSessionResearchCache junction table
✅ **Research Source Configuration**: `lib/config/research-sources.ts` with Exa.ai and Grok support
✅ **Research Service V2**: `lib/services/research/research-service-v2.ts` with:
  - Unified interface via `performMarketResearchV2()`
  - Exa.ai semantic search integration
  - Grok X/Twitter analysis via OpenRouter
  - 12-hour cache with automatic lookup
✅ **Session Worker Integration**: RESEARCHING status and junction table linkage
✅ **Cache Read Path**: Check cache before making expensive API calls
✅ **Environment Variables**: Both EXA_API_KEY and OPENROUTER_API_KEY configured

### Pending (Next Steps)
- [ ] Write vitests for research service integrations
- [ ] Create radio group UI component for research source selection
- [ ] Create research source selection card component
- [ ] Update prediction generator to use research results
- [ ] Update tRPC schemas and routers for v2 endpoints

### Note on Naming
The research service was renamed from `enhanced-research-service.ts` to `research-service-v2.ts` and the main function from `performEnhancedMarketResearch` to `performMarketResearchV2` for clarity and consistency with the v2 deployment strategy.

## Implementation Timeline

**Week 1-2: Foundation**
- Database schema updates with migration
- Enhanced research service structure  
- Basic Exa.ai integration
- **Testing**: Write minimal vitests for research service functions

**Week 3-4: UI Integration**
- Radio group component creation
- Research source selection card
- Cost calculation updates
- Design system token additions
- **Testing**: Write minimal vitests for UI components

**Week 5-6: Session Flow**
- Prediction session worker enhancements
- Research phase integration
- Error handling and fallbacks
- **Testing**: Write minimal vitests for session worker integration
- Testing and refinement

**Week 7: Phase 1 Cleanup**
- Remove `lib/services/market-research-service.ts`
- Remove `scripts/3-generate-market-research.ts`
- Update all references to use new research service architecture
- Final integration testing and deployment preparation

**Phase 2 (Future): Advanced Features**
- Google/Bing API integration
- Multi-source research blending
- Per-model research configuration
- Advanced sentiment analysis combining sources

## Success Metrics

**Immediate (Phase 1)**:
- Research source selection completion rate > 90%
- Research phase adds < 30 seconds to session time
- Research results improve prediction confidence scores
- Zero session failures due to research errors

**Long-term**:
- Prediction accuracy improvement vs baseline
- User satisfaction with research quality
- Cost efficiency of research vs prediction value
- Research result cache hit rates

## Testing Strategy

### Minimal Vitest Requirements
After each major code addition, write focused unit tests covering:

**Research Services** (`lib/services/research/`):
- `performMarketResearchV2` - Route selection logic
- `performExaResearch` - API integration and response formatting
- `performGrokResearch` - X/Twitter search and sentiment analysis using `x-ai/grok-4` model via OpenRouter
- Error handling and fallback scenarios

**UI Components** (`features/prediction/` & `shared/ui/`):
- `ResearchSourceSelectionCard` - Radio button interactions
- `RadioGroup` components - Selection state management
- Cost calculation with research sources
- Loading states during research phase

**Session Worker Integration**:
- Research phase execution within prediction sessions
- Research result caching and retrieval
- Error recovery when research fails
- Research context passing to prediction generation

**Test Principles**:
- Keep tests lightweight and fast-running
- Mock external API calls (Exa, Grok)
- Focus on critical business logic paths
- Use existing test patterns from the codebase

## Risk Mitigation

**Research API Failures**: Graceful degradation to current OpenRouter search
**Cost Management**: Clear cost display and confirmation before session start  
**Performance**: Parallel research execution with timeouts
**User Experience**: Clear progress indication during research phase

---

*This specification provides the foundation for sophisticated market research integration while maintaining the simplicity and reliability of the current prediction system.*