#!/usr/bin/env node

import { config } from 'dotenv'
import { PrismaClient } from '../../lib/generated/prisma'

// Load environment variables from .env (standard approach)
config()

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log('Connecting to database...')
  
  try {
    console.log('Clearing all tables...')
    
    // Order of deletion matters due to foreign key constraints
    await prisma.prediction.deleteMany({})
    await prisma.researchCache.deleteMany({})
    await prisma.market.deleteMany({})
    await prisma.event.deleteMany({})
    await prisma.aiModel.deleteMany({})
    
    console.log('✅ All tables cleared successfully!')
    
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase()