import { PantryItem } from '../types';

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const toISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDaysUntilExpiry = (expiryDate: string | undefined): number | null => {
  if (!expiryDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const getEffectiveExpiry = (item: Partial<PantryItem>): string | undefined => {
  const dates: Date[] = [];

  if (item.expiration_date) {
    dates.push(new Date(item.expiration_date));
  }

  if (item.opened_date && item.days_after_open) {
    const afterOpen = addDays(new Date(item.opened_date), item.days_after_open);
    dates.push(afterOpen);
  }

  if (dates.length === 0) return undefined;

  const earliest = dates.reduce((a, b) => (a < b ? a : b));
  return toISODate(earliest);
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // poniedziałek
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
