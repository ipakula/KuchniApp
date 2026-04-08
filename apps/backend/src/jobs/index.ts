import { startExpirationCheckJob } from './expiration-check.job';
import { startWeeklyCheckJob } from './weekly-check.job';

export function startJobs() {
  startExpirationCheckJob();
  startWeeklyCheckJob();
  console.log('[Jobs] Wszystkie zadania cykliczne uruchomione');
}
