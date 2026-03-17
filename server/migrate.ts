import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
import { getDatabaseUrl } from './db';

// Load environment variables
dotenv.config();

// Configure neon for local development
neonConfig.webSocketConstructor = ws;

async function runMigrations() {
  console.log('🔄 Starting database migration...');
  
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
