import { PrismaClient } from '@/lib/generated/prisma'

async function checkDatabasePermissions() {
  console.log('🔍 Checking database user permissions...\n')

  // Test both pooled and unpooled connections
  const pooledClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  const unpooledClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_UNPOOLED
      }
    }
  })

  try {
    // Check current users
    console.log('=== POOLED CONNECTION (DATABASE_URL) ===')
    const pooledUser = await pooledClient.$queryRaw`SELECT current_user, session_user`
    console.log('Current users:', pooledUser)

    // Check schema permissions for pooled connection
    const pooledSchemaPerms = await pooledClient.$queryRaw`
      SELECT 
        schemaname,
        has_schema_privilege(current_user, schemaname, 'USAGE') as can_use,
        has_schema_privilege(current_user, schemaname, 'CREATE') as can_create
      FROM pg_tables 
      WHERE schemaname = 'public' 
      GROUP BY schemaname
    `
    console.log('Schema permissions (pooled):', pooledSchemaPerms)

    // Check table permissions for key tables
    const pooledTablePerms = await pooledClient.$queryRaw`
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
    console.log('Table permissions (pooled):')
    console.table(pooledTablePerms)

    console.log('\n=== UNPOOLED CONNECTION (DATABASE_URL_UNPOOLED) ===')
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

    // Test actual insert capability
    console.log('\n=== TESTING ACTUAL OPERATIONS ===')
    
    console.log('Testing pooled connection insert...')
    try {
      await pooledClient.$queryRaw`SELECT 1 as test_query`
      console.log('✅ Pooled SELECT works')
      
      // Try a simple insert test (will rollback)
      await pooledClient.$queryRaw`BEGIN`
      await pooledClient.$queryRaw`INSERT INTO research_cache (source, model_name, user_message, system_message) VALUES ('test', 'test-model', 'test message', 'test system')`
      await pooledClient.$queryRaw`ROLLBACK`
      console.log('✅ Pooled INSERT works')
    } catch (error) {
      console.log('❌ Pooled operation failed:', error instanceof Error ? error.message : error)
    }

    console.log('\nTesting unpooled connection insert...')
    try {
      await unpooledClient.$queryRaw`SELECT 1 as test_query`
      console.log('✅ Unpooled SELECT works')
      
      // Try a simple insert test (will rollback)
      await unpooledClient.$queryRaw`BEGIN`
      await unpooledClient.$queryRaw`INSERT INTO research_cache (source, model_name, user_message, system_message) VALUES ('test', 'test-model', 'test message', 'test system')`
      await unpooledClient.$queryRaw`ROLLBACK`
      console.log('✅ Unpooled INSERT works')
    } catch (error) {
      console.log('❌ Unpooled operation failed:', error instanceof Error ? error.message : error)
    }

  } catch (error) {
    console.error('Error checking permissions:', error)
  } finally {
    await pooledClient.$disconnect()
    await unpooledClient.$disconnect()
  }
}

if (require.main === module) {
  checkDatabasePermissions().catch(console.error)
}