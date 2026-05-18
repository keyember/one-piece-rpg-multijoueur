import fs from 'fs';
import path from 'path';
import { db } from '../db';

export async function runMigrations(): Promise<void> {
  // Créer la table de suivi si elle n'existe pas
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const migrationsDir = path.resolve(__dirname, '../../sql/migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('[Migrations] Aucun dossier migrations trouvé, skip.');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const already = await db.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    );
    if (already.rowCount! > 0) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`[Migrations] Application de ${file}...`);
    await db.query(sql);
    await db.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`[Migrations] ${file} appliqué.`);
  }
}
