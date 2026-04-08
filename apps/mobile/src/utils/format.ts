import { UNIT_LABELS } from '../constants/units';
import { CATEGORY_ICONS } from '../constants/categories';

export const formatQuantity = (quantity: number, unit: string): string => {
  const label = UNIT_LABELS[unit] || unit;
  const qty = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  return `${qty} ${label}`;
};

export const getCategoryIcon = (category?: string): string => {
  if (!category) return '🛒';
  return CATEGORY_ICONS[category] || '🛒';
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
