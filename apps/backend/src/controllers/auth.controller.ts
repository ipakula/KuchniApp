import { Response } from 'express';
import { AuthRequest } from '../types';
import * as usersService from '../services/users.service';
import { sendSuccess, sendError } from '../utils/response';

export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, display_name } = req.body;
    const firebaseUid = req.firebaseUid!;

    const user = await usersService.createUser(firebaseUid, email, display_name);
    sendSuccess(res, user, 201);
  } catch (err) {
    sendError(res, 'Błąd rejestracji użytkownika', 500);
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await usersService.getUser(req.userId!);
    if (!user) { sendError(res, 'Użytkownik nie znaleziony', 404); return; }
    sendSuccess(res, user);
  } catch {
    sendError(res, 'Błąd pobierania profilu', 500);
  }
}

export async function updateMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await usersService.updateUser(req.userId!, req.body);
    sendSuccess(res, user);
  } catch {
    sendError(res, 'Błąd aktualizacji profilu', 500);
  }
}

export async function deleteMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    await usersService.deleteUser(req.userId!);
    sendSuccess(res, { message: 'Konto usunięte' });
  } catch {
    sendError(res, 'Błąd usuwania konta', 500);
  }
}

export async function savePushToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { token, platform } = req.body;
    await usersService.savePushToken(req.userId!, token, platform);
    sendSuccess(res, { message: 'Token zapisany' });
  } catch {
    sendError(res, 'Błąd zapisu tokenu', 500);
  }
}

export async function getLocations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const locations = await usersService.getLocations(req.userId!);
    sendSuccess(res, locations);
  } catch {
    sendError(res, 'Błąd pobierania lokalizacji', 500);
  }
}

export async function getBasicProducts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const products = await usersService.getBasicProducts(req.userId!);
    sendSuccess(res, products);
  } catch {
    sendError(res, 'Błąd pobierania produktów bazowych', 500);
  }
}
