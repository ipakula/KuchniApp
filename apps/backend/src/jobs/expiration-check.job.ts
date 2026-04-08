import cron from 'node-cron';
import { query } from '../db/connection';
import { sendPushNotification } from '../services/notification.service';

// Uruchamia się codziennie o godzinie 9:00
export function startExpirationCheckJob() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[JOB:ExpirationCheck] Sprawdzanie dat ważności...');

    try {
      // Produkty wygasające w ciągu 3 dni
      const { rows: expiringSoon } = await query(`
        SELECT pi.id, pi.name, pi.expiration_date, pi.user_id
        FROM pantry_items pi
        WHERE pi.status NOT IN ('consumed', 'discarded', 'expired')
          AND pi.expiration_date IS NOT NULL
          AND pi.expiration_date <= CURRENT_DATE + INTERVAL '3 days'
          AND pi.expiration_date >= CURRENT_DATE
        ORDER BY pi.user_id, pi.expiration_date
      `);

      // Produkty już przeterminowane
      const { rows: expired } = await query(`
        SELECT pi.id, pi.name, pi.expiration_date, pi.user_id
        FROM pantry_items pi
        WHERE pi.status NOT IN ('consumed', 'discarded', 'expired')
          AND pi.expiration_date IS NOT NULL
          AND pi.expiration_date < CURRENT_DATE
        ORDER BY pi.user_id
      `);

      // Oznacz przeterminowane
      if (expired.length > 0) {
        const expiredIds = expired.map((i) => i.id);
        await query(
          `UPDATE pantry_items SET status = 'expired' WHERE id = ANY($1::uuid[])`,
          [expiredIds]
        );
      }

      // Grupuj po użytkowniku — produkty kończące się
      const byUser: Record<string, typeof expiringSoon> = {};
      for (const item of expiringSoon) {
        if (!byUser[item.user_id]) byUser[item.user_id] = [];
        byUser[item.user_id].push(item);
      }

      for (const [userId, items] of Object.entries(byUser)) {
        const count = items.length;
        const names = items.slice(0, 3).map((i) => i.name).join(', ');
        await sendPushNotification(userId, {
          title: `⚠️ ${count} ${count === 1 ? 'produkt kończy się' : 'produkty kończą się'}`,
          body: names + (count > 3 ? ` i ${count - 3} więcej...` : ''),
          data: {
            type: 'expiring_soon',
            itemIds: items.map((i) => i.id),
            action: 'generate_recipe',
          },
        });
      }

      // Powiadomienia o przeterminowanych
      const byUserExpired: Record<string, typeof expired> = {};
      for (const item of expired) {
        if (!byUserExpired[item.user_id]) byUserExpired[item.user_id] = [];
        byUserExpired[item.user_id].push(item);
      }

      for (const [userId, items] of Object.entries(byUserExpired)) {
        const count = items.length;
        await sendPushNotification(userId, {
          title: `🗑️ ${count} ${count === 1 ? 'produkt jest przeterminowany' : 'produkty są przeterminowane'}`,
          body: items.slice(0, 3).map((i) => i.name).join(', '),
          data: { type: 'expired', itemIds: items.map((i) => i.id) },
        });
      }

      console.log(`[JOB:ExpirationCheck] Zakończono. Kończące się: ${expiringSoon.length}, Przeterminowane: ${expired.length}`);
    } catch (err) {
      console.error('[JOB:ExpirationCheck] Błąd:', err);
    }
  });

  console.log('[JOB:ExpirationCheck] Zaplanowany na 9:00 codziennie');
}
