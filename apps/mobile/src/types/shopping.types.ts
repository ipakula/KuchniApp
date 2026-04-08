export type ShoppingSource = 'manual' | 'basic_products' | 'meal_plan' | 'low_stock' | 'ai_suggestion';

export interface ShoppingItem {
  id: string;
  shopping_list_id: string;
  product_id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  is_checked: boolean;
  source: ShoppingSource;
  meal_plan_id?: string;
  checked_at?: string;
  added_at: string;
}

export interface AddShoppingItemDTO {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  product_id?: string;
}
