import { useEffect } from 'react';
import { usePantryStore } from '../store/pantry.store';

export function usePantry() {
  const store = usePantryStore();

  useEffect(() => {
    // Zawsze odświeżaj przy montowaniu — eliminuje problem starego cache z AsyncStorage
    store.fetchItems();
    store.fetchStats();
    store.fetchLocations();
  }, []);

  return {
    items: store.items,
    stats: store.stats,
    loading: store.loading,
    locations: store.locations,
    expiringItems: store.getExpiringItems(),
    fetchItems: store.fetchItems,
    fetchStats: store.fetchStats,
    fetchLocations: store.fetchLocations,
    addItem: store.addItem,
    updateItem: store.updateItem,
    removeItem: store.removeItem,
    consumeItem: store.consumeItem,
    openItem: store.openItem,
    discardItem: store.discardItem,
    getItemsByLocation: store.getItemsByLocation,
  };
}
