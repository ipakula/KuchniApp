import { query } from '../db/connection';
import { getEffectiveExpiry } from '../utils/date';

interface ExpirationInfo {
  days: number;
  notes: string;
  source: 'db' | 'ai' | 'default';
}

// Pobierz sugestię terminu przydatności z bazy wiedzy
export async function getShelfLifeFromDB(
  productName: string,
  category: string,
  location: string
): Promise<ExpirationInfo | null> {
  const { rows } = await query(
    `SELECT days_shelf_life, notes FROM product_shelf_life
     WHERE (LOWER(product_name) LIKE $1 OR LOWER(category) = $2)
       AND (location = $3 OR location IS NULL)
     ORDER BY
       CASE WHEN LOWER(product_name) LIKE $1 THEN 0 ELSE 1 END,
       CASE WHEN location = $3 THEN 0 ELSE 1 END
     LIMIT 1`,
    [`%${productName.toLowerCase()}%`, category.toLowerCase(), location]
  );

  if (rows[0]) {
    return {
      days: rows[0].days_shelf_life,
      notes: rows[0].notes || '',
      source: 'db',
    };
  }

  return null;
}

// Oblicz efektywną datę ważności dla pozycji spiżarni
export function calculateEffectiveExpiry(
  expirationDate?: string,
  openedDate?: string,
  daysAfterOpen?: number
): string | undefined {
  return getEffectiveExpiry({ expiration_date: expirationDate, opened_date: openedDate, days_after_open: daysAfterOpen });
}
