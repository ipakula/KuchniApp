import { apiClient } from './client';
import { PantryItem, AddPantryItemDTO, PantryStats } from '../types/pantry.types';

export const getPantryItems = async (params?: {
  location?: string;
  status?: string;
  expiring_days?: number;
}): Promise<PantryItem[]> => {
  const { data } = await apiClient.get('/pantry', { params });
  return data.data;
};

export const getPantryItem = async (id: string): Promise<PantryItem> => {
  const { data } = await apiClient.get(`/pantry/${id}`);
  return data.data;
};

export const addPantryItem = async (item: AddPantryItemDTO): Promise<PantryItem> => {
  const { data } = await apiClient.post('/pantry', item);
  return data.data;
};

export const updatePantryItem = async (
  id: string,
  item: Partial<AddPantryItemDTO>
): Promise<PantryItem> => {
  const { data } = await apiClient.patch(`/pantry/${id}`, item);
  return data.data;
};

export const deletePantryItem = async (id: string): Promise<void> => {
  await apiClient.delete(`/pantry/${id}`);
};

export const consumeItem = async (id: string): Promise<void> => {
  await apiClient.post(`/pantry/${id}/consume`);
};

export const openItem = async (id: string): Promise<PantryItem> => {
  const { data } = await apiClient.post(`/pantry/${id}/open`);
  return data.data;
};

export const discardItem = async (id: string): Promise<void> => {
  await apiClient.post(`/pantry/${id}/discard`);
};

export const getPantryStats = async (): Promise<PantryStats> => {
  const { data } = await apiClient.get('/pantry/stats');
  return data.data;
};

export const getExpiringItems = async (days = 3): Promise<PantryItem[]> => {
  const { data } = await apiClient.get('/pantry/expiring', { params: { days } });
  return data.data;
};

export const getProductHistory = async (): Promise<PantryItem[]> => {
  const { data } = await apiClient.get('/pantry/history');
  return data.data;
};

export const getProductByBarcode = async (barcode: string) => {
  const { data } = await apiClient.get(`/products/barcode/${barcode}`);
  return data.data;
};
