import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PantryItem, PantryStats, AddPantryItemDTO } from '../types/pantry.types';
import * as pantryApi from '../api/pantry.api';
import { getDaysUntilExpiry } from '../utils/date';

interface PantryStore {
  items: PantryItem[];
  stats: PantryStats | null;
  locations: Array<{ id: string; name: string; icon: string }>;
  loading: boolean;
  lastSync: number | null;

  fetchItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchLocations: () => Promise<void>;
  addItem: (item: AddPantryItemDTO) => Promise<PantryItem>;
  updateItem: (id: string, data: Partial<AddPantryItemDTO>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  consumeItem: (id: string) => Promise<void>;
  openItem: (id: string) => Promise<void>;
  discardItem: (id: string) => Promise<void>;

  getExpiringItems: () => PantryItem[];
  getItemsByLocation: (locationName: string) => PantryItem[];
}

export const usePantryStore = create<PantryStore>()(
  persist(
    (set, get) => ({
      items: [],
      stats: null,
      locations: [],
      loading: false,
      lastSync: null,

      fetchItems: async () => {
        set({ loading: true });
        try {
          const items = await pantryApi.getPantryItems();
          set({ items, lastSync: Date.now() });
        } finally {
          set({ loading: false });
        }
      },

      fetchStats: async () => {
        const stats = await pantryApi.getPantryStats();
        set({ stats });
      },

      fetchLocations: async () => {
        const { data } = await import('../api/auth.api').then((m) => ({
          data: m.getLocations(),
        }));
        const locations = await data;
        set({ locations });
      },

      addItem: async (item) => {
        const newItem = await pantryApi.addPantryItem(item);
        set((s) => ({ items: [newItem, ...s.items] }));
        return newItem;
      },

      updateItem: async (id, data) => {
        const updated = await pantryApi.updatePantryItem(id, data);
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? updated : i)),
        }));
      },

      removeItem: async (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        await pantryApi.deletePantryItem(id);
      },

      consumeItem: async (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        await pantryApi.consumeItem(id);
      },

      openItem: async (id) => {
        const today = new Date().toISOString().split('T')[0];
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, status: 'opened', opened_date: today } : i
          ),
        }));
        await pantryApi.openItem(id);
      },

      discardItem: async (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        await pantryApi.discardItem(id);
      },

      getExpiringItems: () => {
        return get()
          .items.filter((i) => {
            const days = getDaysUntilExpiry(i.effective_expiry || i.expiration_date);
            return days !== null && days <= 3 && days >= 0;
          })
          .sort((a, b) => {
            const da = getDaysUntilExpiry(a.expiration_date) ?? 99;
            const db = getDaysUntilExpiry(b.expiration_date) ?? 99;
            return da - db;
          });
      },

      getItemsByLocation: (locationName) => {
        return get().items.filter((i) => i.location_name === locationName);
      },
    }),
    {
      name: 'pantry-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items, lastSync: s.lastSync }),
    }
  )
);
