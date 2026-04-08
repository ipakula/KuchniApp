import { apiClient } from './client';
import { User } from '../types/user.types';

export const registerUser = async (email: string, displayName?: string): Promise<User> => {
  const { data } = await apiClient.post('/auth/register', { email, display_name: displayName });
  return data.data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await apiClient.get('/auth/me');
  return data.data;
};

export const updateMe = async (updates: Partial<User>): Promise<User> => {
  const { data } = await apiClient.patch('/auth/me', updates);
  return data.data;
};

export const savePushToken = async (token: string, platform: string): Promise<void> => {
  await apiClient.post('/auth/push-token', { token, platform });
};

export const getLocations = async () => {
  const { data } = await apiClient.get('/auth/locations');
  return data.data;
};

export const getBasicProducts = async () => {
  const { data } = await apiClient.get('/auth/basic-products');
  return data.data;
};
