#!/usr/bin/env tsx
/**
 * User Credit Management Script
 * 
 * Usage:
 *   # Add credits to user
 *   tsx scripts/manage-user-credits.ts add user@example.com 500
 *   
 *   # Set user credits to specific amount  
 *   tsx scripts/manage-user-credits.ts set user@example.com 1000
 *   
 *   # Reset user to weekly minimum (100)
 *   tsx scripts/manage-user-credits.ts reset user@example.com
 *   
 *   # View user credit info
 *   tsx scripts/manage-user-credits.ts info user@example.com
 */

import { PrismaClient } from '@/lib/generated/prisma'
import * as userService from '@/lib/services/user-service'

const prisma = new PrismaClient()

async function main() {
  const [action, userIdentifier, amountStr] = process.argv.slice(2)
  
  if (!action || !userIdentifier) {
    console.log(`
Usage:
  tsx scripts/manage-user-credits.ts <action> <user-email-or-id> [amount]

Actions:
  add <user> <amount>    - Add credits to user
  set <user> <amount>    - Set user credits to amount
  reset <user>           - Reset user to weekly minimum (100)
  info <user>            - Show user credit information

Examples:
  tsx scripts/manage-user-credits.ts add user@example.com 500
  tsx scripts/manage-user-credits.ts set user@example.com 1000
  tsx scripts/manage-user-credits.ts reset user@example.com
  tsx scripts/manage-user-credits.ts info user@example.com
`)
    process.exit(1)
  }

  try {
    // Find user by email or ID
    let user = await userService.getUserByEmail(prisma, userIdentifier)
    if (!user) {
      user = await userService.getUserById(prisma, userIdentifier)
    }
    
    if (!user) {
      console.error(`❌ User not found: ${userIdentifier}`)
      process.exit(1)
    }

    console.log(`📋 Found user: ${user.email || user.id} (${user.username || 'No username'})`)
    console.log(`💰 Current credits: ${user.credits}`)

    switch (action.toLowerCase()) {
      case 'add': {
        const amount = parseInt(amountStr)
        if (isNaN(amount) || amount <= 0) {
          console.error('❌ Please provide a valid positive amount')
          process.exit(1)
        }

        const updatedUser = await userService.updateUserCredits(
          prisma,
          user.id,
          user.credits + amount,
          user.totalCreditsEarned + amount
        )

        console.log(`✅ Added ${amount} credits`)
        console.log(`💰 New balance: ${updatedUser?.credits}`)
        break
      }

      case 'set': {
        const amount = parseInt(amountStr)
        if (isNaN(amount) || amount < 0) {
          console.error('❌ Please provide a valid non-negative amount')
          process.exit(1)
        }

        const creditsAdded = Math.max(0, amount - user.credits)
        const updatedUser = await userService.updateUserCredits(
          prisma,
          user.id,
          amount,
          user.totalCreditsEarned + creditsAdded
        )

        console.log(`✅ Set credits to ${amount}`)
        console.log(`💰 New balance: ${updatedUser?.credits}`)
        break
      }

      case 'reset': {
        const updatedUser = await userService.resetUserWeeklyCredits(prisma, user.id, 100)
        
        console.log(`✅ Reset weekly credits`)
        console.log(`💰 New balance: ${updatedUser?.credits}`)
        console.log(`📅 Reset timestamp: ${updatedUser?.creditsLastReset}`)
        break
      }

      case 'info': {
        const credits = await userService.getUserCredits(prisma, user.id)
        
        console.log(`\n📊 User Credit Information:`)
        console.log(`   Current Credits: ${credits?.credits}`)
        console.log(`   Total Earned: ${credits?.totalCreditsEarned}`)
        console.log(`   Total Spent: ${credits?.totalCreditsSpent}`)
        console.log(`   Last Reset: ${credits?.creditsLastReset}`)
        break
      }

      default:
        console.error(`❌ Unknown action: ${action}`)
        console.error('Valid actions: add, set, reset, info')
        process.exit(1)
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()