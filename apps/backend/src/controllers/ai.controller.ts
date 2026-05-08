import { Response } from 'express';
import { AuthRequest } from '../types';
import * as aiService from '../services/ai.service';
import * as pantryService from '../services/pantry.service';
import * as usersService from '../services/users.service';
import * as mealPlansService from '../services/meal-plans.service';
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
    const simplified = items.slice(0, 50).map((i) => ({
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

// Unit-aware thresholds for low stock detection
const LOW_STOCK_THRESHOLDS: Record<string, number> = {
  szt: 2,
  opak: 1,
  g: 200,
  kg: 0.5,
  ml: 250,
  l: 0.5,
  łyżka: 3,
  łyżeczka: 3,
  szklanka: 1,
  plaster: 3,
};

function isLowStock(quantity: number, unit: string): boolean {
  const threshold = LOW_STOCK_THRESHOLDS[unit] ?? 1;
  return quantity <= threshold;
}

export async function extractExpiryDate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { image_base64 } = req.body;
    if (!image_base64) { sendError(res, 'Brak obrazu', 400); return; }
    const result = await aiService.extractExpiryDateFromImage(image_base64);
    sendSuccess(res, result);
  } catch (err: any) {
    console.error('[AI] extractExpiryDate error:', err?.message || err);
    const detail = err?.response?.data?.error?.message || err?.message || 'Nieznany błąd';
    sendError(res, `Błąd rozpoznawania daty: ${detail}`, 500);
  }
}

export async function shoppingSuggestions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [items, basicProducts, weekMissingIngredients] = await Promise.all([
      pantryService.getPantryItems(req.userId!),
      usersService.getBasicProducts(req.userId!),
      mealPlansService.getMissingIngredients(req.userId!, new Date()).catch(() => []),
    ]);

    // Low stock: unit-aware thresholds
    const lowStock = items
      .filter((i) => isLowStock(i.quantity, i.unit))
      .map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit }));

    // Missing basics: exact word boundary match to avoid false positives
    const pantryNames = items.map((i) => i.name.toLowerCase().trim());
    const missingBasic = (basicProducts as Array<{ name: string }>).filter((bp) => {
      const bpLower = bp.name.toLowerCase().trim();
      return !pantryNames.some(
        (pn) => pn === bpLower || pn.startsWith(bpLower + ' ') || pn.includes(' ' + bpLower)
      );
    }).map((bp) => bp.name);

    // Missing meal plan ingredients (already cross-referenced with pantry by the service)
    const mealPlanMissing = weekMissingIngredients.map((m) => m.ingredient);

    const suggestions = await aiService.generateShoppingSuggestions(
      lowStock.map((i) => `${i.name} (${i.quantity} ${i.unit})`),
      missingBasic,
      mealPlanMissing
    );

    sendSuccess(res, suggestions);
  } catch {
    sendError(res, 'Błąd generowania sugestii zakupów', 500);
  }
}
