# Research Integration System Specification

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

```prisma
model PredictionSession {
  id                   String                  @id @default(cuid())
  userId               String                  @map("user_id")
  marketId             String                  @map("market_id")
  selectedModels       String[]                @map("selected_models")
  selectedResearchSource String?               @map("selected_research_source") // NEW
  researchResults      Json?                   @map("research_results") // NEW
  status               PredictionSessionStatus @default(INITIALIZING)
  step                 String?
  error                String?
  createdAt            DateTime                @default(now()) @map("created_at")
  completedAt          DateTime?               @map("completed_at")
  
  // ... existing relations
}

model ResearchCache {
  id            Int       @id @default(autoincrement())
  marketId      String?   @map("market_id")
  source        String    @map("source") // NEW: "exa", "grok", "google", "bing"
  modelName     String    @map("model_name") // Keep for backward compatibility
  systemMessage String?   @map("system_message")
  userMessage   String    @map("user_message")
  response      Json?
  createdAt     DateTime? @default(now()) @map("created_at")
  market        Market?   @relation(fields: [marketId], references: [id])
}
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

**Location**: `features/prediction/prediction-generator.client.tsx`

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
// lib/services/research/enhanced-research-service.ts
import { RESEARCH_SOURCES } from '@/lib/config/research-sources'

export interface ResearchResult {
  source: string
  relevant_information: string
  links: string[]
  confidence_score?: number
  timestamp: Date
}

export async function performEnhancedMarketResearch(
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
  // 2. Construct semantic search query  
  // 3. Call Exa.ai API
  // 4. Process and format results
  // 5. Cache results via research-cache-service
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
import { performEnhancedMarketResearch } from '@/lib/services/research/enhanced-research-service'

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
      researchResults = await performEnhancedMarketResearch(
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

### Multi-Source Support
```typescript
// Future expansion - backward compatible
PredictionSession {
  selectedResearchSources: string[] // Multiple sources
  researchConfig: {
    sources: string[]
    perModelOverrides?: Record<string, string[]>
    qualityThreshold?: number
  }
}
```

### Advanced Research Features
- **Research Quality Scoring**: Confidence metrics for research results
- **Source Blending**: Combine results from multiple sources
- **Per-Model Research**: Custom research sources per AI model
- **Research Templates**: Pre-configured research strategies by market type

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
- `performEnhancedMarketResearch` - Route selection logic
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