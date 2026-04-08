import { Response } from 'express';
import { AuthRequest } from '../types';
import * as recipesService from '../services/recipes.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getUserRecipes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const recipes = await recipesService.getUserRecipes(req.userId!);
    sendSuccess(res, recipes);
  } catch {
    sendError(res, 'Błąd pobierania przepisów', 500);
  }
}

export async function getRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const recipe = await recipesService.getRecipe(req.userId!, req.params.id);
    if (!recipe) { sendError(res, 'Przepis nie znaleziony', 404); return; }
    sendSuccess(res, recipe);
  } catch {
    sendError(res, 'Błąd pobierania przepisu', 500);
  }
}

export async function generateRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      pantry_items,
      meal_type,
      servings,
      diet,
      preferences,
      equipment,
    } = req.body;

    const recipe = await recipesService.generateAndSaveRecipe(req.userId!, {
      pantryIngredients: pantry_items || [],
      mealType: meal_type || 'obiad',
      servings: servings || 2,
      diet,
      preferences,
      equipment,
    });

    sendSuccess(res, recipe, 201);
  } catch (err) {
    console.error('[RecipeController] Błąd generowania:', err);
    sendError(res, 'Błąd generowania przepisu AI', 500);
  }
}

export async function saveRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const recipe = await recipesService.saveRecipe(req.userId!, req.body);
    sendSuccess(res, recipe, 201);
  } catch {
    sendError(res, 'Błąd zapisywania przepisu', 500);
  }
}

export async function deleteRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ok = await recipesService.deleteRecipe(req.userId!, req.params.id);
    if (!ok) { sendError(res, 'Przepis nie znaleziony', 404); return; }
    sendSuccess(res, { message: 'Przepis usunięty' });
  } catch {
    sendError(res, 'Błąd usuwania przepisu', 500);
  }
}
