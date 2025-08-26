/**
 * Structured Logger for Prediction Sessions
 * Provides consistent, machine-readable logging format for monitoring and debugging
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  sessionId?: string
  userId?: string
  marketId?: string
  modelName?: string
  duration?: number
  error?: {
    message: string
    code?: string
    stack?: string
  }
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  event: string
  message: string
  context: LogContext
  timestamp: string
}

class StructuredLogger {
  private log(level: LogLevel, event: string, message: string, context: LogContext = {}) {
    const logEntry: LogEntry = {
      level,
      event,
      message,
      context,
      timestamp: new Date().toISOString()
    }

    // In production, this could send to a logging service
    // For now, use console with structured format
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

    // Log in a structured JSON format that's easy to parse
    logMethod(JSON.stringify(logEntry, null, 2))
  }

  info(event: string, message: string, context: LogContext = {}) {
    this.log('info', event, message, context)
  }

  warn(event: string, message: string, context: LogContext = {}) {
    this.log('warn', event, message, context)
  }

  error(event: string, message: string, context: LogContext = {}) {
    this.log('error', event, message, context)
  }

  // Prediction session specific logging methods
  predictionSessionStarted(sessionId: string, userId: string, marketId: string, selectedModels: string[]) {
    this.info('prediction_session_started', 'New prediction session created', {
      sessionId,
      userId,
      marketId,
      selectedModels,
      modelCount: selectedModels.length
    })
  }

  predictionSessionModelProcessing(sessionId: string, modelName: string, step: string) {
    this.info('prediction_session_model_processing', `Processing model ${modelName}`, {
      sessionId,
      modelName,
      step
    })
  }

  predictionSessionModelCompleted(sessionId: string, modelName: string, success: boolean, duration: number) {
    this.info('prediction_session_model_completed', `Model ${modelName} ${success ? 'succeeded' : 'failed'}`, {
      sessionId,
      modelName,
      success,
      duration
    })
  }

  predictionSessionCompleted(sessionId: string, status: string, successfulModels: number, failedModels: number, duration: number) {
    this.info('prediction_session_completed', `Session ${status} with ${successfulModels} successes and ${failedModels} failures`, {
      sessionId,
      status,
      successfulModels,
      failedModels,
      totalModels: successfulModels + failedModels,
      duration
    })
  }

  predictionSessionError(sessionId: string, userId: string, error: Error, context: LogContext = {}) {
    this.error('prediction_session_error', 'Prediction session failed', {
      sessionId,
      userId,
      error: {
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      },
      ...context
    })
  }

  predictionRateLimited(userId: string, marketId: string) {
    this.warn('prediction_rate_limited', 'User hit rate limit for predictions', {
      userId,
      marketId
    })
  }

  predictionCreditsConsumed(userId: string, sessionId: string, credits: number, reason: string) {
    this.info('prediction_credits_consumed', `Consumed ${credits} credits`, {
      userId,
      sessionId,
      credits,
      reason
    })
  }
}

// Export singleton instance
export const structuredLogger = new StructuredLogger()

// Export types for use in other modules
export type { LogContext, LogEntry }
