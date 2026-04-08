export type PantryStatus = 'unopened' | 'opened' | 'expired' | 'consumed' | 'discarded';
export type Unit = 'szt' | 'g' | 'kg' | 'ml' | 'l' | 'opakowanie' | 'łyżka' | 'łyżeczka' | 'szklanka';

export interface PantryItem {
  id: string;
  user_id: string;
  product_id?: string;
  location_id?: string;
  location_name?: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  quantity: number;
  unit: Unit;
  status: PantryStatus;
  expiration_date?: string;
  opened_date?: string;
  days_after_open?: number;
  effective_expiry?: string;
  notes?: string;
  added_from: string;
  created_at: string;
  updated_at: string;
}

export interface PantryLocation {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_default: boolean;
}

export interface PantryStats {
  total: number;
  expiring_soon: number;
  expired: number;
}

export interface AddPantryItemDTO {
  product_id?: string;
  location_id?: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  quantity: number;
  unit: Unit;
  expiration_date?: string;
  days_after_open?: number;
  notes?: string;
  added_from?: string;
}
