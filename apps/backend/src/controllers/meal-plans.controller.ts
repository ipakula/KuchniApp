import { Response } from 'express';
import { AuthRequest } from '../types';
import * as mealPlansService from '../services/meal-plans.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getMealPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const weekDate = req.query.week
      ? new Date(req.query.week as string)
      : new Date();
    const entries = await mealPlansService.getMealPlan(req.userId!, weekDate);
    sendSuccess(res, entries);
  } catch {
    sendError(res, 'Błąd pobierania planu posiłków', 500);
  }
}

export async function addEntry(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { meal_date, meal_type, recipe_id, servings } = req.body;
    const entry = await mealPlansService.addMealPlanEntry(req.userId!, {
      mealDate: meal_date,
      mealType: meal_type,
      recipeId: recipe_id,
      servings,
    });
    sendSuccess(res, entry, 201);
  } catch {
    sendError(res, 'Błąd dodawania posiłku do planu', 500);
  }
}

export async function deleteEntry(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ok = await mealPlansService.deleteMealPlanEntry(req.userId!, req.params.id);
    if (!ok) { sendError(res, 'Wpis nie znaleziony', 404); return; }
    sendSuccess(res, { message: 'Wpis usunięty' });
  } catch {
    sendError(res, 'Błąd usuwania wpisu', 500);
  }
}

export async function markCooked(req: AuthRequest, res: Response): Promise<void> {
  try {
    const entry = await mealPlansService.markMealCooked(req.userId!, req.params.id);
    if (!entry) { sendError(res, 'Wpis nie znaleziony', 404); return; }
    sendSuccess(res, entry);
  } catch {
    sendError(res, 'Błąd oznaczania posiłku', 500);
  }
}

export async function getMissingIngredients(req: AuthRequest, res: Response): Promise<void> {
  try {
    const weekDate = req.query.week
      ? new Date(req.query.week as string)
      : new Date();
    const missing = await mealPlansService.getMissingIngredients(req.userId!, weekDate);
    sendSuccess(res, missing);
  } catch {
    sendError(res, 'Błąd pobierania brakujących składników', 500);
  }
}
