import { apiClient } from './client';

export type SuggestionReason = 'low_stock' | 'missing_basic' | 'meal_plan' | 'ai';

export interface ShoppingSuggestion {
  name: string;
  reason: SuggestionReason;
  category?: string;
}

export const suggestCategory = async (productName: string): Promise<string> => {
  const { data } = await apiClient.post('/ai/suggest-category', { product_name: productName });
  return data.data.category;
};

export const suggestExpiration = async (
  productName: string,
  status: 'opened' | 'unopened'
): Promise<{ days: number; notes: string }> => {
  const { data } = await apiClient.post('/ai/suggest-expiration', {
    product_name: productName,
    status,
  });
  return data.data;
};

export const analyzePantry = async (): Promise<{ summary: string; tips: string[] }> => {
  const { data } = await apiClient.get('/ai/analyze-pantry');
  return data.data;
};

export const getShoppingSuggestions = async (): Promise<ShoppingSuggestion[]> => {
  const { data } = await apiClient.get('/ai/shopping-suggestions');
  return data.data;
};
