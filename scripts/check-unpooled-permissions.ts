import { PrismaClient } from '@/lib/generated/prisma'

async function checkUnpooledPermissions() {
  console.log('🔍 Checking UNPOOLED database user permissions...\n')

  const unpooledClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_UNPOOLED
      }
    }
  })

  try {
    console.log('=== UNPOOLED CONNECTION (DATABASE_URL_UNPOOLED) ===')
    const unpooledUser = await unpooledClient.$queryRaw`SELECT current_user, session_user`
    console.log('Current users:', unpooledUser)

    // Check schema permissions for unpooled connection
    const unpooledSchemaPerms = await unpooledClient.$queryRaw`
      SELECT 
        schemaname,
        has_schema_privilege(current_user, schemaname, 'USAGE') as can_use,
        has_schema_privilege(current_user, schemaname, 'CREATE') as can_create
      FROM pg_tables 
      WHERE schemaname = 'public' 
      GROUP BY schemaname
    `
    console.log('Schema permissions (unpooled):', unpooledSchemaPerms)

    // Check table permissions for unpooled
    const unpooledTablePerms = await unpooledClient.$queryRaw`
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
    console.log('Table permissions (unpooled):')
    console.table(unpooledTablePerms)

    // Test actual operations
    console.log('\n=== TESTING ACTUAL OPERATIONS (UNPOOLED) ===')
    
    try {
      await unpooledClient.$queryRaw`SELECT 1 as test_query`
      console.log('✅ Unpooled SELECT works')
      
      // Try a simple insert test (will rollback)
      await unpooledClient.$queryRaw`BEGIN`
      await unpooledClient.$queryRaw`INSERT INTO research_cache (source, model_name, user_message, system_message) VALUES ('test', 'test-model', 'test message', 'test system')`
      await unpooledClient.$queryRaw`ROLLBACK`
      console.log('✅ Unpooled INSERT works')
    } catch (error) {
      console.log('❌ Unpooled operation failed:', error.message)
    }

  } catch (error) {
    console.error('Error checking unpooled permissions:', error)
  } finally {
    await unpooledClient.$disconnect()
  }
}

if (require.main === module) {
  checkUnpooledPermissions().catch(console.error)
}