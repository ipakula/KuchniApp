import { useEffect } from 'react';
import { useShoppingStore } from '../store/shopping.store';

export function useShoppingList() {
  const store = useShoppingStore();

  useEffect(() => {
    store.fetchItems();
  }, []);

  return {
    items: store.items,
    loading: store.loading,
    uncheckedItems: store.getUncheckedItems(),
    checkedItems: store.getCheckedItems(),
    itemsByCategory: store.getItemsByCategory(),
    fetchItems: store.fetchItems,
    addItem: store.addItem,
    removeItem: store.removeItem,
    checkItem: store.checkItem,
    clearChecked: store.clearChecked,
  };
}
