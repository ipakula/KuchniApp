import { apiClient } from './client';

export interface ProductSuggestion {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  default_unit?: string;
}

export const searchProducts = async (q: string): Promise<ProductSuggestion[]> => {
  if (q.length < 2) return [];
  const { data } = await apiClient.get('/products/search', { params: { q } });
  return data.data || [];
};
