import axios from 'axios';
import { auth } from '../lib/firebase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor — dołącza Firebase ID token do każdego żądania
apiClient.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('[API] Nie udało się pobrać tokenu Firebase:', err);
  }
  return config;
});

// Interceptor — obsługa błędów globalnych
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token wygasł — wyloguj
      auth.signOut();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
