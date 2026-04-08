import { Response } from 'express';
import { AuthRequest } from '../types';
import * as aiService from '../services/ai.service';
import * as pantryService from '../services/pantry.service';
import * as usersService from '../services/users.service';
import { sendSuccess, sendError } from '../utils/response';

export async function suggestCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { product_name } = req.body;
    const category = await aiService.suggestCategory(product_name);
    sendSuccess(res, { category });
  } catch {
    sendError(res, 'Błąd sugestii kategorii', 500);
  }
}

export async function suggestExpiration(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { product_name, status } = req.body;
    const result = await aiService.suggestExpiration(product_name, status || 'opened');
    sendSuccess(res, result);
  } catch {
    sendError(res, 'Błąd sugestii terminu ważności', 500);
  }
}

export async function analyzePantry(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await pantryService.getPantryItems(req.userId!);
    const simplified = items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      expiration_date: i.expiration_date,
    }));
    const analysis = await aiService.analyzePantry(simplified);
    sendSuccess(res, analysis);
  } catch {
    sendError(res, 'Błąd analizy spiżarni', 500);
  }
}

export async function shoppingSuggestions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await pantryService.getPantryItems(req.userId!);
    const basicProducts = await usersService.getBasicProducts(req.userId!);

    const lowStock = items
      .filter((i) => i.quantity <= 1)
      .map((i) => i.name);

    const pantryNames = items.map((i) => i.name.toLowerCase());
    const missingBasic = (basicProducts as Array<{ name: string }>)
      .filter((bp) => !pantryNames.some((pn) => pn.includes(bp.name.toLowerCase())))
      .map((bp) => bp.name);

    const suggestions = await aiService.generateShoppingSuggestions(
      lowStock,
      missingBasic,
      []
    );
    sendSuccess(res, suggestions);
  } catch {
    sendError(res, 'Błąd generowania sugestii zakupów', 500);
  }
}
