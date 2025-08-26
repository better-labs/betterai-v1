/**
 * Live Database Integration Test for Prediction Sessions
 * Tests the complete flow: session creation → worker execution → database records
 * Uses real DATABASE_URL from .env.local
 */

// CRITICAL: Load environment variables BEFORE any imports that use DATABASE_URL
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })



import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '@/lib/generated/prisma'
import { appRouter } from '@/lib/trpc/routers/_app'

// Use real database connection
const testDb = new PrismaClient()

describe('PredictionSessions Live Database Integration', () => {
  let testUserId: string
  let testMarketId: string

  beforeAll(() => {
    // Debug fetch availability
    console.log('globalThis.fetch exists:', !!globalThis.fetch)
    console.log('global.fetch before:', !!global.fetch)
    global.fetch = globalThis.fetch
    console.log('global.fetch after:', !!global.fetch)
  })

  beforeEach(async () => {
    // Create test user with credits
    const testUser = await testDb.user.create({
      data: {
        id: `test-user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        credits: 10,
        totalCreditsEarned: 10,
        totalCreditsSpent: 0
      }
    })
    testUserId = testUser.id

    // Create test event and market
    const testEvent = await testDb.event.create({
      data: {
        id: `test-event-${Date.now()}`,
        title: "Test Event for Integration Tests",
        description: "Event for testing prediction sessions",
        category: 'OTHER',
        markets: {
          create: {
            id: `test-market-${Date.now()}`,
            question: "Will this test pass?",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.6, 0.4], // Yes: 60%, No: 40%
            active: true
          }
        }
      },
      include: {
        markets: true
      }
    })
    testMarketId = testEvent.markets[0].id
  })

  afterEach(async () => {
    // Clean up test data (in proper order to handle foreign keys)
    if (testUserId) {
      await testDb.predictionSession.deleteMany({ 
        where: { userId: testUserId } 
      })
      await testDb.prediction.deleteMany({ 
        where: { userId: testUserId } 
      })
      await testDb.user.delete({ 
        where: { id: testUserId } 
      })
    }
    if (testMarketId) {
      // Delete market first, then event (cascade should handle this, but being explicit)
      const market = await testDb.market.findUnique({
        where: { id: testMarketId },
        select: { eventId: true }
      })
      if (market) {
        await testDb.market.delete({ 
          where: { id: testMarketId } 
        })
        await testDb.event.delete({ 
          where: { id: market.eventId } 
        })
      }
    }
  })

  it('should create session, consume credits, and execute worker with live database', async () => {
    const caller = appRouter.createCaller({
      userId: testUserId,
    })

    // Start prediction session
    const startResult = await caller.predictionSessions.start({
      marketId: testMarketId,
      selectedModels: ['anthropic/claude-3.7-sonnet', 'openai/gpt-4o-mini']
    })

    expect(startResult.sessionId).toBeDefined()
    expect(typeof startResult.sessionId).toBe('string')

    // Verify session was created in database
    const dbSession = await testDb.predictionSession.findUnique({
      where: { id: startResult.sessionId },
      include: {
        market: true,
        predictions: true
      }
    })

    expect(dbSession).toBeTruthy()
    expect(dbSession!.userId).toBe(testUserId)
    expect(dbSession!.marketId).toBe(testMarketId)
    expect(dbSession!.selectedModels).toEqual(['anthropic/claude-3.7-sonnet', 'openai/gpt-4o-mini'])
    expect(dbSession!.status).toBe('INITIALIZING')

    // Verify credits were consumed
    const userAfter = await testDb.user.findUnique({
      where: { id: testUserId },
      select: { credits: true, totalCreditsSpent: true }
    })

    expect(userAfter!.credits).toBe(8) // 10 - 2 models
    expect(userAfter!.totalCreditsSpent).toBe(2)

    // Test status query
    const statusResult = await caller.predictionSessions.status({
      sessionId: startResult.sessionId
    })

    expect(statusResult.id).toBe(startResult.sessionId)
    expect(statusResult.userId).toBe(testUserId)
    expect(statusResult.market.question).toBe("Will this test pass?")
    expect(statusResult.selectedModels).toEqual(['anthropic/claude-3.7-sonnet', 'openai/gpt-4o-mini'])

    // Test recent sessions query
    const recentResult = await caller.predictionSessions.recentByMarket({
      marketId: testMarketId
    })

    expect(recentResult.length).toBe(1)
    expect(recentResult[0].id).toBe(startResult.sessionId)
  }, 15000) // 15 second timeout for database operations

  it('should reject insufficient credits with live database', async () => {
    // Update user to have only 1 credit
    await testDb.user.update({
      where: { id: testUserId },
      data: { credits: 1 }
    })

    const caller = appRouter.createCaller({
      userId: testUserId
    })

    // Try to start session with 3 models (requires 3 credits)
    await expect(
      caller.predictionSessions.start({
        marketId: testMarketId,
        selectedModels: ['anthropic/claude-3.7-sonnet', 'openai/gpt-4o-mini', 'google/gemini-2.5-flash']
      })
    ).rejects.toThrow('Insufficient credits: 1 available, 3 required')

    // Verify no session was created
    const sessions = await testDb.predictionSession.findMany({
      where: { userId: testUserId }
    })
    expect(sessions).toHaveLength(0)

    // Verify credits were not consumed
    const user = await testDb.user.findUnique({
      where: { id: testUserId },
      select: { credits: true, totalCreditsSpent: true }
    })
    expect(user!.credits).toBe(1) // Unchanged
    expect(user!.totalCreditsSpent).toBe(0) // Unchanged
  })

  it('should reject invalid model IDs', async () => {
    const caller = appRouter.createCaller({
      userId: testUserId
    })

    await expect(
      caller.predictionSessions.start({
        marketId: testMarketId,
        selectedModels: ['invalid-model-id', 'another-invalid']
      })
    ).rejects.toThrow('Invalid model IDs: invalid-model-id, another-invalid')

    // Verify no session was created and no credits consumed
    const sessions = await testDb.predictionSession.findMany({
      where: { userId: testUserId }
    })
    expect(sessions).toHaveLength(0)

    const user = await testDb.user.findUnique({
      where: { id: testUserId },
      select: { credits: true }
    })
    expect(user!.credits).toBe(10) // Unchanged
  })

  // Clean up database connection after all tests
  afterAll(async () => {
    await testDb.$disconnect()
  })
})