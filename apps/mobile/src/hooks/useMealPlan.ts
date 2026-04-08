import { useEffect } from 'react';
import { usePlannerStore } from '../store/planner.store';
import { toISODate } from '../utils/date';

export function useMealPlan() {
  const store = usePlannerStore();

  useEffect(() => {
    store.fetchWeekPlan();
    store.fetchRecipes();
  }, []);

  return {
    entries: store.entries,
    recipes: store.recipes,
    currentWeek: store.currentWeek,
    loading: store.loading,
    generatingRecipe: store.generatingRecipe,
    fetchWeekPlan: store.fetchWeekPlan,
    fetchRecipes: store.fetchRecipes,
    addEntry: store.addEntry,
    removeEntry: store.removeEntry,
    markCooked: store.markCooked,
    navigateWeek: store.navigateWeek,
    getEntriesForDate: store.getEntriesForDate,
    todayEntries: store.getTodayEntries(),
  };
}
