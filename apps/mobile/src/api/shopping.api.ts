import { apiClient } from './client';
import { ShoppingItem, AddShoppingItemDTO } from '../types/shopping.types';

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
  const { data } = await apiClient.get('/shopping');
  return data.data;
};

export const addShoppingItem = async (item: AddShoppingItemDTO): Promise<ShoppingItem> => {
  const { data } = await apiClient.post('/shopping', item);
  return data.data;
};

export const updateShoppingItem = async (
  id: string,
  item: Partial<AddShoppingItemDTO>
): Promise<ShoppingItem> => {
  const { data } = await apiClient.patch(`/shopping/${id}`, item);
  return data.data;
};

export const deleteShoppingItem = async (id: string): Promise<void> => {
  await apiClient.delete(`/shopping/${id}`);
};

export const checkShoppingItem = async (id: string): Promise<ShoppingItem> => {
  const { data } = await apiClient.post(`/shopping/${id}/check`);
  return data.data;
};

export const clearCheckedItems = async (): Promise<void> => {
  await apiClient.delete('/shopping/checked');
};
