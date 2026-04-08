import app from './app';
import { config } from './config';
import { pool } from './db/connection';
import { startJobs } from './jobs';

async function bootstrap() {
  // Test połączenia z bazą danych
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Połączenie z bazą danych OK');
  } catch (err) {
    console.error('[DB] Błąd połączenia z bazą danych:', err);
    process.exit(1);
  }

  // Uruchom zadania cykliczne
  if (config.nodeEnv !== 'test') {
    startJobs();
  }

  // Uruchom serwer
  app.listen(config.port, () => {
    console.log(`[Server] KuchniApp API uruchomiony na porcie ${config.port}`);
    console.log(`[Server] Środowisko: ${config.nodeEnv}`);
    console.log(`[Server] Health: http://localhost:${config.port}/health`);
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Krytyczny błąd:', err);
  process.exit(1);
});
