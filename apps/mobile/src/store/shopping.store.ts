import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingItem, AddShoppingItemDTO } from '../types/shopping.types';
import * as shoppingApi from '../api/shopping.api';

interface ShoppingStore {
  items: ShoppingItem[];
  loading: boolean;

  fetchItems: () => Promise<void>;
  addItem: (item: AddShoppingItemDTO) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  checkItem: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;

  getUncheckedItems: () => ShoppingItem[];
  getCheckedItems: () => ShoppingItem[];
  getItemsByCategory: () => Record<string, ShoppingItem[]>;
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      fetchItems: async () => {
        set({ loading: true });
        try {
          const items = await shoppingApi.getShoppingList();
          set({ items });
        } finally {
          set({ loading: false });
        }
      },

      addItem: async (item) => {
        const newItem = await shoppingApi.addShoppingItem(item);
        set((s) => ({ items: [...s.items, newItem] }));
      },

      removeItem: async (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        await shoppingApi.deleteShoppingItem(id);
      },

      checkItem: async (id) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, is_checked: !i.is_checked } : i
          ),
        }));
        await shoppingApi.checkShoppingItem(id);
      },

      clearChecked: async () => {
        set((s) => ({ items: s.items.filter((i) => !i.is_checked) }));
        await shoppingApi.clearCheckedItems();
      },

      getUncheckedItems: () => get().items.filter((i) => !i.is_checked),
      getCheckedItems: () => get().items.filter((i) => i.is_checked),

      getItemsByCategory: () => {
        const grouped: Record<string, ShoppingItem[]> = {};
        for (const item of get().items) {
          const cat = item.category || 'Inne';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(item);
        }
        return grouped;
      },
    }),
    {
      name: 'shopping-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items }),
    }
  )
);
