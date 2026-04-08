export type DietPreference = 'none' | 'vegetarian' | 'vegan' | 'gluten_free' | 'lactose_free';

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name?: string;
  household_size: number;
  diet_preference: DietPreference;
  kitchen_equipment: string[];
  created_at: string;
  updated_at: string;
}

export interface BasicProduct {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  min_quantity: number;
  unit: string;
  is_active: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  data: Record<string, unknown>;
  is_read: boolean;
  sent_at: string;
}
