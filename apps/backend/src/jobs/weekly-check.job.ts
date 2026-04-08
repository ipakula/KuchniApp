import cron from 'node-cron';
import { query } from '../db/connection';
import { sendPushNotification } from '../services/notification.service';

// Uruchamia się w niedzielę o 18:00
export function startWeeklyCheckJob() {
  cron.schedule('0 18 * * 0', async () => {
    console.log('[JOB:WeeklyCheck] Wysyłanie tygodniowych przypomnień...');

    try {
      const { rows: users } = await query(
        `SELECT DISTINCT u.id
         FROM users u
         JOIN push_tokens pt ON pt.user_id = u.id
         JOIN pantry_items pi ON pi.user_id = u.id
         WHERE pi.status NOT IN ('consumed', 'discarded')`
      );

      for (const user of users) {
        await sendPushNotification(user.id, {
          title: '📋 Tygodniowy przegląd spiżarni',
          body: 'Sprawdź co masz w spiżarni i co warto uzupełnić.',
          data: { type: 'weekly_check', action: 'open_pantry' },
        });
      }

      console.log(`[JOB:WeeklyCheck] Wysłano do ${users.length} użytkowników`);
    } catch (err) {
      console.error('[JOB:WeeklyCheck] Błąd:', err);
    }
  });

  console.log('[JOB:WeeklyCheck] Zaplanowany na niedzielę 18:00');
}
