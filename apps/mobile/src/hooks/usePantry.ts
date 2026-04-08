import { useEffect } from 'react';
import { usePantryStore } from '../store/pantry.store';

export function usePantry() {
  const store = usePantryStore();

  useEffect(() => {
    // Odświeżaj jeśli dane starsze niż 5 minut
    const fiveMin = 5 * 60 * 1000;
    const shouldRefresh = !store.lastSync || Date.now() - store.lastSync > fiveMin;
    if (shouldRefresh) {
      store.fetchItems();
      store.fetchStats();
    }
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
