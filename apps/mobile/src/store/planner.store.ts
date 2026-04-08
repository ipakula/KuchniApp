import { create } from 'zustand';
import { MealPlanEntry, MealType, Recipe } from '../types/recipe.types';
import * as mealPlansApi from '../api/meal-plans.api';
import * as recipesApi from '../api/recipes.api';
import { toISODate, getMonday } from '../utils/date';

interface PlannerStore {
  entries: MealPlanEntry[];
  recipes: Recipe[];
  currentWeek: Date;
  loading: boolean;
  generatingRecipe: boolean;

  fetchWeekPlan: (week?: Date) => Promise<void>;
  fetchRecipes: () => Promise<void>;
  addEntry: (mealDate: string, mealType: MealType, recipeId: string, servings?: number) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  markCooked: (id: string) => Promise<void>;
  setCurrentWeek: (date: Date) => void;
  navigateWeek: (direction: 1 | -1) => void;

  getEntriesForDate: (date: string) => MealPlanEntry[];
  getTodayEntries: () => MealPlanEntry[];
}

export const usePlannerStore = create<PlannerStore>()((set, get) => ({
  entries: [],
  recipes: [],
  currentWeek: getMonday(new Date()),
  loading: false,
  generatingRecipe: false,

  fetchWeekPlan: async (week) => {
    set({ loading: true });
    try {
      const weekDate = week || get().currentWeek;
      const entries = await mealPlansApi.getMealPlan(toISODate(weekDate));
      set({ entries });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecipes: async () => {
    const recipes = await recipesApi.getUserRecipes();
    set({ recipes });
  },

  addEntry: async (mealDate, mealType, recipeId, servings) => {
    const entry = await mealPlansApi.addMealPlanEntry({
      meal_date: mealDate,
      meal_type: mealType,
      recipe_id: recipeId,
      servings,
    });
    set((s) => ({
      entries: [
        ...s.entries.filter(
          (e) => !(e.meal_date === mealDate && e.meal_type === mealType)
        ),
        entry,
      ],
    }));
  },

  removeEntry: async (id) => {
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
    await mealPlansApi.deleteMealPlanEntry(id);
  },

  markCooked: async (id) => {
    const updated = await mealPlansApi.markMealCooked(id);
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    }));
  },

  setCurrentWeek: (date) => set({ currentWeek: getMonday(date) }),

  navigateWeek: (direction) => {
    const current = get().currentWeek;
    const next = new Date(current);
    next.setDate(next.getDate() + direction * 7);
    set({ currentWeek: getMonday(next) });
    get().fetchWeekPlan(next);
  },

  getEntriesForDate: (date) => get().entries.filter((e) => e.meal_date === date),

  getTodayEntries: () => {
    const today = toISODate(new Date());
    return get().entries.filter((e) => e.meal_date === today);
  },
}));
