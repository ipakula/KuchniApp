import { apiClient } from './client';
import { MealPlanEntry, MealType } from '../types/recipe.types';

export const getMealPlan = async (week?: string): Promise<MealPlanEntry[]> => {
  const { data } = await apiClient.get('/meal-plans', { params: { week } });
  return data.data;
};

export const addMealPlanEntry = async (entry: {
  meal_date: string;
  meal_type: MealType;
  recipe_id: string;
  servings?: number;
}): Promise<MealPlanEntry> => {
  const { data } = await apiClient.post('/meal-plans/entries', entry);
  return data.data;
};

export const deleteMealPlanEntry = async (id: string): Promise<void> => {
  await apiClient.delete(`/meal-plans/entries/${id}`);
};

export const markMealCooked = async (id: string): Promise<MealPlanEntry> => {
  const { data } = await apiClient.post(`/meal-plans/entries/${id}/cook`);
  return data.data;
};

export const getMissingIngredients = async (week?: string) => {
  const { data } = await apiClient.get('/meal-plans/missing-ingredients', { params: { week } });
  return data.data;
};
