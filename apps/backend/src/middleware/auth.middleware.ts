import { Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { AuthRequest } from '../types';
import { query } from '../db/connection';
import { sendError } from '../utils/response';
import { createUser } from '../services/users.service';

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

    if (rows[0]) {
      req.userId = rows[0].id;
    } else {
      // Użytkownik zalogowany przez Firebase ale nie ma jeszcze rekordu w DB.
      // Tworzymy automatycznie — eliminuje problem chicken-and-egg z /register.
      const email = decoded.email || `${decoded.uid}@unknown.com`;
      const displayName = decoded.name || undefined;
      const newUser = await createUser(decoded.uid, email, displayName);
      req.userId = newUser.id;
    }

    next();
  } catch (err: any) {
    console.error('[authMiddleware]', err?.message || err);
    sendError(res, 'Nieprawidłowy lub wygasły token', 401);
  }
};
