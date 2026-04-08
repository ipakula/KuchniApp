import { Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { AuthRequest } from '../types';
import { query } from '../db/connection';
import { sendError } from '../utils/response';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Brak tokenu autoryzacji', 401);
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUid = decoded.uid;

    const { rows } = await query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [decoded.uid]
    );

    if (!rows[0]) {
      sendError(res, 'Użytkownik nie znaleziony. Zarejestruj się najpierw.', 401);
      return;
    }

    req.userId = rows[0].id;
    next();
  } catch (err) {
    sendError(res, 'Nieprawidłowy lub wygasły token', 401);
  }
};
