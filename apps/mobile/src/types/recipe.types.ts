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
  source: 'ai' | 'manual';
  ai_prompt?: string;
  created_at: string;
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
  cooked_at?: string;
  recipe_title?: string;
  recipe_description?: string;
  ingredients?: RecipeIngredient[];
  instructions?: RecipeInstruction[];
  prep_time_min?: number;
  cook_time_min?: number;
  diet_tags?: string[];
}

export interface GenerateRecipeDTO {
  pantry_items: string[];
  meal_type: MealType;
  servings: number;
  diet?: string;
  preferences?: string;
  equipment?: string[];
  custom_tags?: string[];
}
