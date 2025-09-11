import { prisma } from '@/lib/db/prisma'

async function testConnection() {
  try {
    console.log('Testing database connection...')
    const result = await prisma.$queryRaw`SELECT current_user, version()`
    console.log('✅ Connection successful!', result)
    
    // Test a simple query
    const eventCount = await prisma.event.count()
    console.log(`✅ Found ${eventCount} events in database`)
    
    await prisma.$disconnect()
    console.log('✅ Disconnected successfully')
  } catch (error) {
    console.error('❌ Connection failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

testConnection()