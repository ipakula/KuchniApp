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

export async function createLocation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, icon } = req.body;
    if (!name) { sendError(res, 'Nazwa lokalizacji jest wymagana', 400); return; }
    const location = await usersService.createLocation(req.userId!, name, icon || '🏠');
    sendSuccess(res, location, 201);
  } catch {
    sendError(res, 'Błąd tworzenia lokalizacji', 500);
  }
}

export async function deleteLocation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deleted = await usersService.deleteLocation(req.userId!, req.params.id);
    if (!deleted) { sendError(res, 'Nie można usunąć lokalizacji (domyślna lub nie istnieje)', 400); return; }
    sendSuccess(res, { message: 'Usunięto' });
  } catch {
    sendError(res, 'Błąd usuwania lokalizacji', 500);
  }
}

export async function createBasicProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, unit, min_quantity } = req.body;
    if (!name) { sendError(res, 'Nazwa produktu jest wymagana', 400); return; }
    const product = await usersService.createBasicProduct(req.userId!, name, unit || 'szt', min_quantity || 1);
    sendSuccess(res, product, 201);
  } catch {
    sendError(res, 'Błąd tworzenia produktu bazowego', 500);
  }
}

export async function updateBasicProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const product = await usersService.updateBasicProduct(req.userId!, req.params.id, req.body);
    if (!product) { sendError(res, 'Produkt nie znaleziony', 404); return; }
    sendSuccess(res, product);
  } catch {
    sendError(res, 'Błąd aktualizacji produktu bazowego', 500);
  }
}

export async function deleteBasicProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deleted = await usersService.deleteBasicProduct(req.userId!, req.params.id);
    if (!deleted) { sendError(res, 'Produkt nie znaleziony', 404); return; }
    sendSuccess(res, { message: 'Usunięto' });
  } catch {
    sendError(res, 'Błąd usuwania produktu bazowego', 500);
  }
}
