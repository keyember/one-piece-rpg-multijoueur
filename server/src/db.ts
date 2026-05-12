import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL is not set. Exiting.');
  process.exit(1);
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

db.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});
