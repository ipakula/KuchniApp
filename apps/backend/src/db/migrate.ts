import fs from 'fs';
import path from 'path';
import { pool } from './connection';

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  console.log('[Migrate] Uruchamiam migracje...');

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`[Migrate] Wykonuję: ${file}`);
    await pool.query(sql);
    console.log(`[Migrate] ✓ ${file}`);
  }

  console.log('[Migrate] Wszystkie migracje wykonane.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('[Migrate] Błąd migracji:', err);
  process.exit(1);
});
