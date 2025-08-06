import { initializeDatabase, runDatabaseOperation, handleScriptCompletion } from './db-utils';

async function main() {
  const db = initializeDatabase();
  const migrationName = '0003_powerful_magneto';

  await runDatabaseOperation(async () => {
    await db.execute(`CREATE TABLE IF NOT EXISTS "drizzle.__drizzle_migrations" (name text PRIMARY KEY, hash text, created_at bigint)`);
    await db.execute(`INSERT INTO "drizzle.__drizzle_migrations" (name, hash, created_at) VALUES ('${migrationName}', '${migrationName}', EXTRACT(EPOCH FROM NOW()))`);
  }, 'inserting manual migration');

  handleScriptCompletion('Manual migration inserted successfully.').onSuccess();
}

main().catch(handleScriptCompletion('Manual migration failed.').onError);