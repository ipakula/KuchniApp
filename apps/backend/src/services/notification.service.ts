import axios from 'axios';
import { query } from '../db/connection';
import { config } from '../config';

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(userId: string, message: PushMessage): Promise<void> {
  // Pobierz tokeny push użytkownika
  const { rows: tokens } = await query(
    'SELECT token FROM push_tokens WHERE user_id = $1',
    [userId]
  );

  if (tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    title: message.title,
    body: message.body,
    data: message.data || {},
    sound: 'default',
  }));

  try {
    await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...(config.expo.accessToken
          ? { Authorization: `Bearer ${config.expo.accessToken}` }
          : {}),
      },
    });
  } catch (err) {
    console.error('[Notification] Błąd wysyłania push:', err);
  }

  // Zapisz powiadomienie w bazie
  await query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, message.data?.type || 'general', message.title, message.body, JSON.stringify(message.data || {})]
  );
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { rows } = await query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(rows[0]?.count || '0', 10);
}
