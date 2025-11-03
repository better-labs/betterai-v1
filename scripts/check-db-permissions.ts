import { PrismaClient } from '@/lib/generated/prisma'

async function checkDatabasePermissions() {
  console.log('🔍 Checking database user permissions...\n')

  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  try {
    // Check current users
    console.log('=== DATABASE CONNECTION (DATABASE_URL) ===')
    const currentUser = await client.$queryRaw`SELECT current_user, session_user`
    console.log('Current users:', currentUser)

    // Check schema permissions
    const schemaPerms = await client.$queryRaw`
      SELECT
        schemaname,
        has_schema_privilege(current_user, schemaname, 'USAGE') as can_use,
        has_schema_privilege(current_user, schemaname, 'CREATE') as can_create
      FROM pg_tables
      WHERE schemaname = 'public'
      GROUP BY schemaname
    `
    console.log('Schema permissions:', schemaPerms)

    // Check table permissions for key tables
    const tablePerms = await client.$queryRaw`
      SELECT
        tablename,
        has_table_privilege(current_user, 'public.' || tablename, 'SELECT') as can_select,
        has_table_privilege(current_user, 'public.' || tablename, 'INSERT') as can_insert,
        has_table_privilege(current_user, 'public.' || tablename, 'UPDATE') as can_update,
        has_table_privilege(current_user, 'public.' || tablename, 'DELETE') as can_delete
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('events', 'markets', 'research_cache', 'prediction_sessions')
      ORDER BY tablename
    `
    console.log('Table permissions:')
    console.table(tablePerms)

    // Test actual insert capability
    console.log('\n=== TESTING ACTUAL OPERATIONS ===')

    try {
      await client.$queryRaw`SELECT 1 as test_query`
      console.log('✅ SELECT works')

      // Try a simple insert test (will rollback)
      await client.$queryRaw`BEGIN`
      await client.$queryRaw`INSERT INTO research_cache (source, model_name, user_message, system_message) VALUES ('test', 'test-model', 'test message', 'test system')`
      await client.$queryRaw`ROLLBACK`
      console.log('✅ INSERT works')
    } catch (error) {
      console.log('❌ Database operation failed:', error instanceof Error ? error.message : error)
    }

  } catch (error) {
    console.error('Error checking permissions:', error)
  } finally {
    await client.$disconnect()
  }
}

if (require.main === module) {
  checkDatabasePermissions().catch(console.error)
}