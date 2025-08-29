#!/usr/bin/env node

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@/lib/generated/prisma'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking categories in your target date range...\n')
  
  try {
    const now = new Date()
    const targetDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
    const rangeStart = new Date(targetDate.getTime() - 168 * 60 * 60 * 1000) // -168h
    const rangeEnd = new Date(targetDate.getTime() + 168 * 60 * 60 * 1000) // +168h

    console.log(`Date range: ${rangeStart.toISOString()} to ${rangeEnd.toISOString()}\n`)

    // Get markets grouped by category
    const marketsByCategory = await prisma.market.groupBy({
      by: ['id'],
      where: {
        event: {
          endDate: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
      },
      _count: {
        id: true
      }
    })

    // Get actual categories with market details
    const marketsWithCategories = await prisma.market.findMany({
      where: {
        event: {
          endDate: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
      },
      include: {
        event: {
          select: { category: true }
        }
      },
      orderBy: { volume: 'desc' }
    })

    // Group by category
    const categoryGroups = new Map<string, number>()
    marketsWithCategories.forEach(market => {
      const category = market.event?.category || 'NULL'
      categoryGroups.set(category, (categoryGroups.get(category) || 0) + 1)
    })

    console.log('📊 Markets by Category:')
    Array.from(categoryGroups.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`├─ ${category}: ${count} markets`)
      })

    console.log(`\n📈 Total markets: ${marketsWithCategories.length}`)
    console.log(`📈 Unique categories: ${categoryGroups.size}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()