import { UNIT_LABELS } from '../constants/units';
import { CATEGORY_ICONS } from '../constants/categories';

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatQuantity = (quantity: number | string | undefined | null, unit: string): string => {
  const label = UNIT_LABELS[unit] || unit;
  const num = Number(quantity);
  if (isNaN(num)) return `- ${label}`;
  const qty = num % 1 === 0 ? num.toString() : num.toFixed(1);
  return `${qty} ${label}`;
};

export const getCategoryIcon = (category?: string): string => {
  if (!category) return '🛒';
  return CATEGORY_ICONS[category] || '🛒';
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
