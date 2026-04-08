import { differenceInDays, parseISO, format, isToday, isTomorrow, isPast } from 'date-fns';
import { pl } from 'date-fns/locale';

export const getDaysUntilExpiry = (expiryDate?: string): number | null => {
  if (!expiryDate) return null;
  return differenceInDays(parseISO(expiryDate), new Date());
};

export const getExpiryLabel = (expiryDate?: string): string => {
  if (!expiryDate) return '';
  const date = parseISO(expiryDate);

  if (isPast(date) && !isToday(date)) return 'Przeterminowane';
  if (isToday(date)) return 'Wygasa dziś';
  if (isTomorrow(date)) return 'Wygasa jutro';

  const days = differenceInDays(date, new Date());
  if (days <= 3) return `Wygasa za ${days} dni`;
  if (days <= 7) return `Za ${days} dni`;

  return format(date, 'd MMM yyyy', { locale: pl });
};

export const getExpiryStatus = (expiryDate?: string): 'expired' | 'expiring' | 'warning' | 'ok' | 'unknown' => {
  if (!expiryDate) return 'unknown';
  const days = getDaysUntilExpiry(expiryDate);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days === 0) return 'expiring';
  if (days <= 3) return 'expiring';
  if (days <= 7) return 'warning';
  return 'ok';
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'd MMM yyyy', { locale: pl });
};

export const getWeekDates = (weekStart: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
};

export const toISODate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};
