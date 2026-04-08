// ============================================================
// Typy wspólne backendu
// ============================================================

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name?: string;
  household_size: number;
  diet_preference: string;
  kitchen_equipment: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  category?: string;
  default_unit: string;
  image_url?: string;
  source: 'openfoodfacts' | 'manual' | 'ai';
  shelf_life_unopened_days?: number;
  shelf_life_opened_days?: number;
  shelf_life_fridge_days?: number;
  shelf_life_freezer_days?: number;
  created_at: Date;
}

export type PantryStatus = 'unopened' | 'opened' | 'expired' | 'consumed' | 'discarded';
export type PantryLocation = 'fridge' | 'freezer' | 'pantry' | 'cupboard';

export interface PantryItem {
  id: string;
  user_id: string;
  product_id?: string;
  location_id?: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  quantity: number;
  unit: string;
  status: PantryStatus;
  expiration_date?: string;
  opened_date?: string;
  days_after_open?: number;
  notes?: string;
  added_from: string;
  created_at: Date;
  updated_at: Date;
  // computed
  effective_expiry?: string;
  location_name?: string;
}

export interface ShoppingItem {
  id: string;
  shopping_list_id: string;
  product_id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  is_checked: boolean;
  source: string;
  meal_plan_id?: string;
  checked_at?: Date;
  added_at: Date;
}

export interface RecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
  product_id?: string;
  is_optional?: boolean;
}

export interface RecipeInstruction {
  step: number;
  description: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  servings: number;
  prep_time_min?: number;
  cook_time_min?: number;
  diet_tags: string[];
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  image_url?: string;
  source: string;
  ai_prompt?: string;
  created_at: Date;
}

export type MealType = 'sniadanie' | 'obiad' | 'kolacja';
export type MealStatus = 'planned' | 'cooked' | 'skipped';

export interface MealPlanEntry {
  id: string;
  meal_plan_id: string;
  recipe_id?: string;
  meal_date: string;
  meal_type: MealType;
  servings: number;
  status: MealStatus;
  cooked_at?: Date;
  // joined
  recipe_title?: string;
  recipe_description?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  data: Record<string, unknown>;
  is_read: boolean;
  sent_at: Date;
}

// Request extensions
import { Request } from 'express';
export interface AuthRequest extends Request {
  userId?: string;
  firebaseUid?: string;
}
