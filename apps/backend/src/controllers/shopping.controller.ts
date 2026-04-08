import { Response } from 'express';
import { AuthRequest } from '../types';
import * as shoppingService from '../services/shopping.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getList(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await shoppingService.getShoppingList(req.userId!);
    sendSuccess(res, items);
  } catch {
    sendError(res, 'Błąd pobierania listy zakupów', 500);
  }
}

export async function addItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await shoppingService.addShoppingItem(req.userId!, req.body);
    sendSuccess(res, item, 201);
  } catch {
    sendError(res, 'Błąd dodawania pozycji', 500);
  }
}

export async function updateItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await shoppingService.updateShoppingItem(req.userId!, req.params.id, req.body);
    if (!item) { sendError(res, 'Pozycja nie znaleziona', 404); return; }
    sendSuccess(res, item);
  } catch {
    sendError(res, 'Błąd aktualizacji pozycji', 500);
  }
}

export async function deleteItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ok = await shoppingService.deleteShoppingItem(req.userId!, req.params.id);
    if (!ok) { sendError(res, 'Pozycja nie znaleziona', 404); return; }
    sendSuccess(res, { message: 'Pozycja usunięta' });
  } catch {
    sendError(res, 'Błąd usuwania pozycji', 500);
  }
}

export async function checkItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await shoppingService.checkItem(req.userId!, req.params.id);
    sendSuccess(res, item);
  } catch {
    sendError(res, 'Błąd zaznaczania pozycji', 500);
  }
}

export async function clearChecked(req: AuthRequest, res: Response): Promise<void> {
  try {
    await shoppingService.clearCheckedItems(req.userId!);
    sendSuccess(res, { message: 'Zaznaczone pozycje usunięte' });
  } catch {
    sendError(res, 'Błąd czyszczenia listy', 500);
  }
}
