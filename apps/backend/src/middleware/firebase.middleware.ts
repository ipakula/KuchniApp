// Lekki middleware — weryfikuje token Firebase ale NIE sprawdza czy user istnieje w bazie.
// Używany tylko do /auth/register (chicken-and-egg: nie można sprawdzić DB przed rejestracją).
import { Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';

export const firebaseMiddleware = async (
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
    next();
  } catch {
    sendError(res, 'Nieprawidłowy token Firebase', 401);
  }
};
