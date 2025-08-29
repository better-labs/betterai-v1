#!/usr/bin/env tsx

/**
 * Test script to verify Loops integration is working
 * Run with: dotenv -e .env.local -- npx tsx scripts/test-loops-integration.ts
 */

import { upsertUser } from '@/lib/services/user-service'
import { prisma } from '@/lib/db/prisma'

async function testLoopsIntegration() {
  console.log('🧪 Testing Loops integration with test user...\n')

  const testUserId = `test-loops-${Date.now()}`
  const testEmail = `test-loops-${Date.now()}@example.com`

  try {
    console.log(`📧 Creating user with email: ${testEmail}`)

    const user = await upsertUser(prisma, {
      id: testUserId,
      email: testEmail,
      username: 'Test Loops User',
      walletAddress: '0x1234567890abcdef'
    })

    console.log('✅ User created successfully:', {
      id: user.id,
      email: user.email,
      username: user.username
    })

    console.log('\n🔍 Check your Loops dashboard at https://app.loops.so')
    console.log(`   Look for contact with email: ${testEmail}`)
    console.log('   They should be subscribed to mailing list: cmel7blt51ca10izy3kyb7pn3')

    // Wait a bit for async processing
    console.log('\n⏳ Waiting 2 seconds for async processing...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('\n✅ Test completed! Check application logs for Loops integration messages.')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    // Clean up test user
    try {
      await prisma.user.delete({ where: { id: testUserId } })
      console.log('🧹 Test user cleaned up')
    } catch (cleanupError) {
      console.warn('⚠️ Could not clean up test user:', cleanupError)
    }
  }
}

// Run the test
testLoopsIntegration().catch(console.error)
