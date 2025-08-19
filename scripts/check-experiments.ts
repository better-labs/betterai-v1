#!/usr/bin/env node

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  try {
    const { prisma } = await import('../lib/db/prisma')
    
    const predictions = await prisma.prediction.findMany({
      where: {
        experimentTag: {
          not: null
        }
      },
      select: {
        id: true,
        experimentTag: true,
        experimentNotes: true,
        modelName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log(`Found ${predictions.length} predictions with experiment tags:`)
    console.log()

    predictions.forEach(pred => {
      console.log(`ID: ${pred.id}`)
      console.log(`Tag: ${pred.experimentTag}`)
      console.log(`Model: ${pred.modelName}`)
      console.log(`Created: ${pred.createdAt?.toISOString()}`)
      console.log(`Notes: ${pred.experimentNotes || 'None'}`)
      console.log('---')
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

main()