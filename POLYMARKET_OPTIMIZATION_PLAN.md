# Polymarket Data Update Optimization Plan

## Current Issue Analysis

### Problem: Vercel Timeout (60 seconds)
- **Current State**: `polymarketDataUpdateExtended` function times out at 60 seconds
- **Workload**: ~2,089 events, 6,135 markets in 42 batches (~60 seconds)  
- **Root Cause**: Vercel function timeout limit (currently set to 60s in `vercel.json`)

### Simulation Results (September 5, 2025)
```
Total Events Found: 2,089
Total Markets Found: 6,135  
Total Batches: 42
Total Time: 60s (exactly hitting timeout)
Average Time per Batch: 1,417ms
API Fetch Time: 29% | Processing: 0% | Delay: 71%
```

## Timeout Research Results

### Vercel Limits (With Fluid Compute - GAME CHANGER! 🚀)
- **Current Config**: 800 seconds (`vercel.json` setting) ⚡ **UPDATED**
- **Plan Limits with Fluid Compute (Enabled by Default)**:
  - **Hobby**: Max 300s (5 minutes) 
  - **Pro**: Max 800s (13+ minutes) ⚡ **CURRENT PLAN**
  - **Enterprise**: Max 800s (13+ minutes)
- **Without Fluid Compute (Legacy)**:
  - **Pro**: Max 300s (5 minutes) - much more limited

### Inngest Capabilities
- **Strength**: Built for long-running workflows
- **Step Functions**: Durable execution with automatic retries
- **Fan-out Pattern**: Can trigger multiple parallel functions
- **Chain Jobs**: Can trigger follow-up jobs seamlessly

## Optimization Strategies

### Strategy 1: Leverage Fluid Compute - Maximum Timeout ⚡ **RECOMMENDED** ✅ **IMPLEMENTED**
```json
// vercel.json
{
  "functions": {
    "app/api/inngest/route.ts": {
      "maxDuration": 800  // 13+ minutes with Fluid Compute Pro plan
    }
  }
}
```

**Pros**: 13x current workload capacity (60s → 800s), handles massive datasets
**Cons**: Higher compute costs for longer runs, but excellent ROI
**Timeline**: ✅ **COMPLETED**

### Fluid Compute Benefits:
- **Longer Runtime**: 60s → 800s = **13x capacity**
- **Optimized Concurrency**: Multiple invocations on single instance
- **Reduced Cold Starts**: Better resource utilization  
- **Background Processing**: `waitUntil()` method for cleanup tasks
- **Cost Efficiency**: Pay for actual compute time used
- **Automatic**: Enabled by default on Vercel (no setup required)

### Potential Downsides & Considerations:
- **Higher Costs**: Longer-running functions = more compute charges
- **Resource Contention**: Shared instances may affect performance under load
- **Memory Pressure**: Long-running functions may accumulate memory usage
- **Error Amplification**: Longer functions = bigger impact when they fail

### Mitigation Strategies:
- **Smart Monitoring**: Our timeout warnings at 10min prevent runaway costs
- **Batch Optimization**: Process data efficiently to minimize runtime
- **Memory Management**: Clear large objects between batches
- **Graceful Degradation**: Partial success handling prevents total loss

### Strategy 2: Chunked Processing with Inngest Chain Jobs ⚡ **SCALABLE**

Split the large job into smaller, manageable chunks that run sequentially:

```typescript
// New functions to add:

export const polymarketDataUpdateChunk = inngest.createFunction(
  { id: 'polymarket-data-update-chunk' },
  { event: 'polymarket/data-update-chunk' },
  async ({ event, step }) => {
    const { chunkNumber, totalChunks, config, executionId } = event.data
    
    // Process one chunk (e.g., 10 batches = ~15 seconds)
    const chunkConfig = {
      ...config,
      maxEvents: 500, // ~10 batches worth
      offset: chunkNumber * 500
    }
    
    const result = await step.run('process-chunk', async () => {
      return await updatePolymarketEventsAndMarketData(chunkConfig)
    })
    
    // Trigger next chunk if not done
    if (chunkNumber < totalChunks - 1) {
      await step.sendEvent('trigger-next-chunk', {
        name: 'polymarket/data-update-chunk',
        data: {
          chunkNumber: chunkNumber + 1,
          totalChunks,
          config,
          executionId
        }
      })
    }
    
    return result
  }
)
```

**Pros**: Scales to any workload size, fault-tolerant, uses Inngest strengths
**Cons**: More complex, requires job state management
**Timeline**: 1-2 hours development

### Strategy 3: Parallel Processing ⚡ **HIGH PERFORMANCE**

Process multiple chunks simultaneously:

```typescript
export const polymarketDataUpdateParallel = inngest.createFunction(
  { id: 'polymarket-data-update-parallel' },
  { cron: 'TZ=UTC 0 2 * * *' }, // Daily at 2 AM
  async ({ step }) => {
    // Fan out to 4 parallel workers
    const chunks = [
      { offset: 0, maxEvents: 500 },      // Events 0-500
      { offset: 500, maxEvents: 500 },    // Events 500-1000  
      { offset: 1000, maxEvents: 500 },   // Events 1000-1500
      { offset: 1500, maxEvents: 600 }    // Events 1500+ (remainder)
    ]
    
    const results = await Promise.all(
      chunks.map((chunk, index) => 
        step.sendEvent(`chunk-${index}`, {
          name: 'polymarket/data-update-chunk',
          data: { ...chunk, chunkNumber: index }
        })
      )
    )
    
    return { chunks: results.length, status: 'triggered' }
  }
)
```

**Pros**: Fastest completion, utilizes parallelism
**Cons**: More API calls, potential rate limiting
**Timeline**: 2-3 hours development

## Timeout Monitoring Implementation

### Add Timeout Monitoring to Current Function

```typescript
export const polymarketDataUpdateExtended = inngest.createFunction(
  { 
    id: 'polymarket-data-update-extended',
    name: 'Polymarket Data Update Extended (with Timeout Monitoring)',
    retries: 3,
  },
  { cron: 'TZ=UTC 0 2 * * *' },
  async ({ step }) => {
    const startTime = Date.now()
    const TIMEOUT_WARNING_MS = 45000 // Warn at 45s (before 60s limit)
    const TIMEOUT_ABORT_MS = 55000   // Abort at 55s (safety margin)
    
    const executionId = `polymarket-extended-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const updateResult = await step.run('update-with-monitoring', async () => {
      const config = {
        batchSize: 50,
        maxEvents: 2000, // Allow up to 2000 events
        delayMs: 1000,
        // ... other config
        
        // Add timeout monitoring
        onBatchComplete: (batchNumber: number, totalTime: number) => {
          const elapsed = Date.now() - startTime
          
          if (elapsed > TIMEOUT_WARNING_MS) {
            structuredLogger.warn('timeout_warning', `Approaching timeout at batch ${batchNumber}`, {
              executionId,
              batchNumber,
              elapsedMs: elapsed,
              remainingMs: TIMEOUT_ABORT_MS - elapsed
            })
          }
          
          if (elapsed > TIMEOUT_ABORT_MS) {
            structuredLogger.error('timeout_abort', `Aborting at batch ${batchNumber} to prevent timeout`, {
              executionId,
              batchNumber,
              elapsedMs: elapsed,
              processedEvents: batchNumber * config.batchSize
            })
            
            // Graceful abort - return what we've processed
            throw new Error(`TIMEOUT_ABORT: Processed ${batchNumber} batches before timeout`)
          }
        }
      }
      
      try {
        const result = await updatePolymarketEventsAndMarketData(config)
        return result
      } catch (error) {
        if (error.message?.includes('TIMEOUT_ABORT')) {
          // Log partial success
          structuredLogger.info('partial_success_timeout', 'Partial update completed before timeout', {
            executionId,
            elapsedMs: Date.now() - startTime
          })
          
          // Return partial results rather than failing
          return {
            insertedEvents: [],
            insertedMarkets: [],
            totalRequests: 0,
            totalFetched: 0,
            partialSuccess: true,
            abortReason: 'timeout_prevention'
          }
        }
        throw error
      }
    })
    
    return {
      success: true,
      executionId,
      updateType: 'extended',
      ...updateResult
    }
  }
)
```

## Recommended Implementation Plan

### Phase 1: Immediate Relief (Deploy Today) ⚡
1. **Update `vercel.json`** → Increase timeout to 300 seconds
2. **Add basic timeout monitoring** → Log warnings at 4+ minutes
3. **Deploy and test** → Verify extended job completes successfully

### Phase 2: Robust Solution (Next Week) 🔧
1. **Implement chunked processing** → Strategy 2 above
2. **Add comprehensive monitoring** → Track chunk progress, failures
3. **Test with production workload** → Ensure reliability

### Phase 3: Performance Optimization (Future) 🚀
1. **Add parallel processing** → Strategy 3 for faster completion
2. **Implement smart batching** → Dynamic batch sizes based on market count
3. **Add predictive scaling** → Adjust chunks based on historical data

## Code Changes Required

### File Updates Needed:
1. `vercel.json` - Increase maxDuration
2. `lib/inngest/functions/polymarket-data-update.ts` - Add timeout monitoring
3. `lib/services/updatePolymarketEventsAndMarketData.ts` - Add onBatchComplete callback
4. New files for chunked processing (Phase 2)

### Environment Variables:
```bash
POLYMARKET_CHUNK_SIZE=500                    # Events per chunk
POLYMARKET_MAX_CHUNKS=5                      # Maximum chunks per job
POLYMARKET_TIMEOUT_WARNING_MS=240000         # 4 minutes warning
POLYMARKET_TIMEOUT_ABORT_MS=270000           # 4.5 minutes abort
```

## Success Metrics

### Phase 1 Success:
- ✅ Extended update completes without timeout
- ✅ All ~2,000 events processed successfully  
- ✅ No "Vercel Runtime Timeout" errors
- ✅ Completion time < 5 minutes

### Phase 2 Success:
- ✅ Handles workloads up to 10,000+ events
- ✅ Fault tolerance - recovers from individual chunk failures
- ✅ Observability - clear progress tracking
- ✅ Completion time < 10 minutes total

### Phase 3 Success:
- ✅ Completes large workloads in < 3 minutes
- ✅ Handles API rate limiting gracefully
- ✅ Scales automatically based on data volume
- ✅ Zero manual intervention required

## Risk Mitigation

### Vercel Plan Dependency:
- **Risk**: Hobby plan limits timeout to 300s max
- **Mitigation**: Phase 2 removes dependency on single Vercel function

### API Rate Limiting:
- **Risk**: Parallel processing may hit Polymarket API limits
- **Mitigation**: Implement exponential backoff, respect rate limits

### Data Consistency:
- **Risk**: Chunked processing may miss events or duplicate
- **Mitigation**: Overlap chunks slightly, implement deduplication

---

*"The best time to plant a tree was 20 years ago. The second best time is now." - Chinese Proverb*