import { apiClient } from './client';
import { Recipe, GenerateRecipeDTO } from '../types/recipe.types';

export const getUserRecipes = async (): Promise<Recipe[]> => {
  const { data } = await apiClient.get('/recipes');
  return data.data;
};

export const getRecipe = async (id: string): Promise<Recipe> => {
  const { data } = await apiClient.get(`/recipes/${id}`);
  return data.data;
};

export const generateRecipe = async (dto: GenerateRecipeDTO): Promise<Recipe> => {
  const { data } = await apiClient.post('/recipes/generate', dto);
  return data.data;
};

export const updateRecipeTags = async (id: string, tags: string[]): Promise<Recipe> => {
  const { data } = await apiClient.patch(`/recipes/${id}/tags`, { tags });
  return data.data;
};

export const importRecipeFromUrl = async (url: string): Promise<Recipe> => {
  const { data } = await apiClient.post('/recipes/import-url', { url });
  return data.data;
};

export const deleteRecipe = async (id: string): Promise<void> => {
  await apiClient.delete(`/recipes/${id}`);
};
