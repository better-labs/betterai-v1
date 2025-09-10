# Credit Refund System Fix Plan

## Problem Analysis

The current credit refund system has a gap: when prediction sessions fail at the **workflow level** (not individual model failures), credits are not being refunded to users. 

### Current Refund Coverage
✅ **Model-level failures**: When all selected models fail to generate predictions, credits are properly refunded (lines 125-148 in `prediction-session-worker.ts`)

❌ **Workflow-level failures**: When the entire worker crashes or fails (lines 187-224 in `prediction-session-worker.ts`), credits are NOT refunded

❌ **Inngest-level failures**: When Inngest processing fails, credits are NOT refunded

## Gap Analysis

1. **Worker execution errors** (prediction-session-worker.ts:187-224)
   - Session gets marked as ERROR
   - No credit refund occurs
   - User loses credits for failed service

2. **Inngest processing errors** (prediction-sessions.ts:94-111) 
   - Session gets marked as ERROR
   - No credit refund occurs
   - User loses credits for infrastructure failures

3. **Retry failures** (prediction-session-worker.ts:264-281)
   - Session marked as ERROR after all retries
   - No credit refund occurs
   - User loses credits for persistent failures

## Recommended Simple Fix

### Option 1: Add Refund Logic to Worker Error Handler (RECOMMENDED)

**File**: `lib/services/prediction-session-worker.ts`

Add credit refund logic to the main worker error handler (lines 187-224):

```typescript
} catch (error) {
  // Get session data for refund before error handling
  let sessionForRefund: any = null;
  try {
    sessionForRefund = await getPredictionSessionById(db, sessionId);
  } catch (refundError) {
    // Log but continue with error handling
  }

  // Log structured error
  if (error instanceof Error) {
    structuredLogger.predictionSessionError(
      sessionId,
      sessionForRefund?.userId || 'unknown',
      error,
      { step: 'worker_execution' }
    )
  }

  // Refund credits if we have session data
  if (sessionForRefund) {
    try {
      await creditManager.refundCredits(
        db,
        sessionForRefund.userId,
        sessionForRefund.selectedModels.length,
        `Workflow failure for session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { marketId: sessionForRefund.marketId }
      )
      
      structuredLogger.info('prediction_session_credits_refunded', `Refunded ${sessionForRefund.selectedModels.length} credits for workflow failure`, {
        sessionId,
        userId: sessionForRefund.userId,
        creditsRefunded: sessionForRefund.selectedModels.length,
        reason: 'workflow_failure'
      })
    } catch (refundError) {
      structuredLogger.error('prediction_session_refund_failed', 'Failed to refund credits for workflow failure', {
        sessionId,
        userId: sessionForRefund.userId,
        error: refundError instanceof Error ? { message: refundError.message, stack: refundError.stack } : { message: 'Unknown refund error' }
      })
    }
  }

  // Update session to error state  
  try {
    await updatePredictionSession(db, sessionId, {
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown worker error'
    })
  } catch (updateError) {
    // existing error handling...
  }

  return {
    success: false,
    totalModels: 0,
    successCount: 0,
    failureCount: 0,
    error: error instanceof Error ? error.message : 'Unknown worker error'
  }
}
```

### Option 2: Add Refund Logic to Inngest Error Handler 

**File**: `lib/inngest/functions/prediction-sessions.ts`

Add credit refund logic to the Inngest error handler (lines 94-111):

```typescript
} catch (error) {
  // Get session for refund
  const session = await getPredictionSessionById(prisma, sessionId, userId)
  
  if (session) {
    // Refund credits for Inngest failure
    try {
      await creditManager.refundCredits(
        prisma,
        userId,
        selectedModels.length,
        `Inngest processing failure for session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { marketId }
      )
      
      structuredLogger.info('prediction_session_credits_refunded', `Refunded ${selectedModels.length} credits for Inngest failure`, {
        sessionId,
        userId,
        creditsRefunded: selectedModels.length,
        reason: 'inngest_failure'
      })
    } catch (refundError) {
      structuredLogger.error('prediction_session_refund_failed', 'Failed to refund credits for Inngest failure', {
        sessionId,
        userId,
        error: refundError instanceof Error ? { message: refundError.message, stack: refundError.stack } : { message: 'Unknown refund error' }
      })
    }
  }

  // existing error handling...
}
```

## Implementation Priority

1. **Start with Option 1** - Fix the worker-level error handler first as it's the main execution path
2. **Add Option 2** - Cover Inngest-level failures as secondary protection
3. **Test both paths** - Verify credits are refunded for both failure scenarios

## Testing Strategy

1. **Simulate worker failures** by introducing temporary errors in `executePredictionSession`
2. **Simulate Inngest failures** by introducing temporary errors in the Inngest function
3. **Verify credit refunds** occur in both scenarios
4. **Check logs** for proper refund tracking

## Benefits

- **User experience**: No lost credits for service failures
- **Reliability**: Comprehensive failure coverage
- **Simplicity**: Minimal code changes to existing error handlers
- **Consistency**: Same refund pattern used throughout the system