import { Response } from 'express';
import { AuthRequest } from '../types';
import { query } from '../db/connection';
import { sendSuccess, sendError } from '../utils/response';

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 50`,
      [req.userId]
    );
    sendSuccess(res, rows);
  } catch {
    sendError(res, 'Błąd pobierania powiadomień', 500);
  }
}

export async function markRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    sendSuccess(res, { message: 'Powiadomienie przeczytane' });
  } catch {
    sendError(res, 'Błąd aktualizacji powiadomienia', 500);
  }
}

export async function markAllRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [req.userId]
    );
    sendSuccess(res, { message: 'Wszystkie powiadomienia przeczytane' });
  } catch {
    sendError(res, 'Błąd aktualizacji powiadomień', 500);
  }
}
