import { Pool } from 'pg';
import { config } from '../config';

// Supabase i inne chmurowe bazy wymagają SSL w produkcji
const isProduction = config.nodeEnv === 'production';

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

pool.on('error', (err) => {
  console.error('[DB] Nieoczekiwany błąd połączenia z bazą danych:', err);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === 'development') {
    console.log('[DB]', { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
};

export const getClient = () => pool.connect();
