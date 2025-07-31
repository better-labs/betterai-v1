require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add icon column to events table
    await client.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS icon text;
    `);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration(); 