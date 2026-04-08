import { Response } from 'express';
import { AuthRequest } from '../types';
import * as pantryService from '../services/pantry.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getItems(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await pantryService.getPantryItems(req.userId!, {
      location: req.query.location as string,
      status: req.query.status as string,
      expiringDays: req.query.expiring_days ? parseInt(req.query.expiring_days as string) : undefined,
    });
    sendSuccess(res, items);
  } catch {
    sendError(res, 'Błąd pobierania spiżarni', 500);
  }
}

export async function getItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await pantryService.getPantryItem(req.userId!, req.params.id);
    if (!item) { sendError(res, 'Produkt nie znaleziony', 404); return; }
    sendSuccess(res, item);
  } catch {
    sendError(res, 'Błąd pobierania produktu', 500);
  }
}

export async function addItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await pantryService.addPantryItem(req.userId!, req.body);
    sendSuccess(res, item, 201);
  } catch {
    sendError(res, 'Błąd dodawania produktu', 500);
  }
}

export async function updateItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await pantryService.updatePantryItem(req.userId!, req.params.id, req.body);
    if (!item) { sendError(res, 'Produkt nie znaleziony', 404); return; }
    sendSuccess(res, item);
  } catch {
    sendError(res, 'Błąd aktualizacji produktu', 500);
  }
}

export async function deleteItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ok = await pantryService.deletePantryItem(req.userId!, req.params.id);
    if (!ok) { sendError(res, 'Produkt nie znaleziony', 404); return; }
    sendSuccess(res, { message: 'Produkt usunięty' });
  } catch {
    sendError(res, 'Błąd usuwania produktu', 500);
  }
}

export async function consumeItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    await pantryService.consumeItem(req.userId!, req.params.id);
    sendSuccess(res, { message: 'Produkt oznaczony jako skonsumowany' });
  } catch {
    sendError(res, 'Błąd akcji', 500);
  }
}

export async function openItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await pantryService.openItem(req.userId!, req.params.id);
    sendSuccess(res, item);
  } catch {
    sendError(res, 'Błąd akcji', 500);
  }
}

export async function discardItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    await pantryService.discardItem(req.userId!, req.params.id);
    sendSuccess(res, { message: 'Produkt wyrzucony' });
  } catch {
    sendError(res, 'Błąd akcji', 500);
  }
}

export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await pantryService.getPantryStats(req.userId!);
    sendSuccess(res, stats);
  } catch {
    sendError(res, 'Błąd pobierania statystyk', 500);
  }
}

export async function getExpiring(req: AuthRequest, res: Response): Promise<void> {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 3;
    const items = await pantryService.getExpiringItems(req.userId!, days);
    sendSuccess(res, items);
  } catch {
    sendError(res, 'Błąd pobierania wygasających produktów', 500);
  }
}

export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const history = await pantryService.getProductHistory(req.userId!);
    sendSuccess(res, history);
  } catch {
    sendError(res, 'Błąd pobierania historii', 500);
  }
}
