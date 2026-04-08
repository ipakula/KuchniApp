import { query } from '../db/connection';
import { PantryItem } from '../types';
import { calculateEffectiveExpiry } from './expiration.service';
import { getDaysUntilExpiry } from '../utils/date';

export async function getPantryItems(
  userId: string,
  filters?: {
    location?: string;
    status?: string;
    expiringDays?: number;
  }
): Promise<PantryItem[]> {
  let sql = `
    SELECT
      pi.*,
      pl.name as location_name
    FROM pantry_items pi
    LEFT JOIN pantry_locations pl ON pi.location_id = pl.id
    WHERE pi.user_id = $1
      AND pi.status NOT IN ('consumed', 'discarded')
  `;
  const params: unknown[] = [userId];

  if (filters?.location) {
    params.push(filters.location);
    sql += ` AND pl.name = $${params.length}`;
  }

  if (filters?.status === 'expiring') {
    const expiringDays = filters.expiringDays || 3;
    sql += ` AND pi.expiration_date <= CURRENT_DATE + INTERVAL '${expiringDays} days'
             AND pi.expiration_date >= CURRENT_DATE`;
  }

  sql += ' ORDER BY pi.expiration_date ASC NULLS LAST, pi.created_at DESC';

  const { rows } = await query(sql, params);

  return rows.map((row) => ({
    ...row,
    effective_expiry: calculateEffectiveExpiry(
      row.expiration_date,
      row.opened_date,
      row.days_after_open
    ),
  }));
}

export async function getPantryItem(userId: string, itemId: string): Promise<PantryItem | null> {
  const { rows } = await query(
    `SELECT pi.*, pl.name as location_name
     FROM pantry_items pi
     LEFT JOIN pantry_locations pl ON pi.location_id = pl.id
     WHERE pi.id = $1 AND pi.user_id = $2`,
    [itemId, userId]
  );
  if (!rows[0]) return null;

  const row = rows[0];
  return {
    ...row,
    effective_expiry: calculateEffectiveExpiry(
      row.expiration_date,
      row.opened_date,
      row.days_after_open
    ),
  };
}

export async function addPantryItem(
  userId: string,
  data: Partial<PantryItem>
): Promise<PantryItem> {
  const { rows } = await query(
    `INSERT INTO pantry_items
       (user_id, product_id, location_id, name, brand, barcode, category,
        quantity, unit, status, expiration_date, days_after_open, notes, added_from)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      userId,
      data.product_id || null,
      data.location_id || null,
      data.name,
      data.brand || null,
      data.barcode || null,
      data.category || null,
      data.quantity || 1,
      data.unit || 'szt',
      data.status || 'unopened',
      data.expiration_date || null,
      data.days_after_open || null,
      data.notes || null,
      data.added_from || 'manual',
    ]
  );

  // Aktualizuj historię produktów
  if (data.product_id) {
    await query(
      `INSERT INTO user_product_history (user_id, product_id, name, barcode)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET last_used = NOW(), use_count = user_product_history.use_count + 1`,
      [userId, data.product_id, data.name, data.barcode || null]
    );
  }

  return rows[0];
}

export async function updatePantryItem(
  userId: string,
  itemId: string,
  data: Partial<PantryItem>
): Promise<PantryItem | null> {
  const fields = Object.entries({
    name: data.name,
    brand: data.brand,
    quantity: data.quantity,
    unit: data.unit,
    status: data.status,
    expiration_date: data.expiration_date,
    opened_date: data.opened_date,
    days_after_open: data.days_after_open,
    location_id: data.location_id,
    notes: data.notes,
  })
    .filter(([, v]) => v !== undefined)
    .map(([k], i) => `${k} = $${i + 3}`)
    .join(', ');

  if (!fields) return null;

  const values = Object.entries({
    name: data.name,
    brand: data.brand,
    quantity: data.quantity,
    unit: data.unit,
    status: data.status,
    expiration_date: data.expiration_date,
    opened_date: data.opened_date,
    days_after_open: data.days_after_open,
    location_id: data.location_id,
    notes: data.notes,
  })
    .filter(([, v]) => v !== undefined)
    .map(([, v]) => v);

  const { rows } = await query(
    `UPDATE pantry_items
     SET ${fields}, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [itemId, userId, ...values]
  );

  return rows[0] || null;
}

export async function deletePantryItem(userId: string, itemId: string): Promise<boolean> {
  const { rowCount } = await query(
    'DELETE FROM pantry_items WHERE id = $1 AND user_id = $2',
    [itemId, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function consumeItem(userId: string, itemId: string): Promise<boolean> {
  const { rowCount } = await query(
    `UPDATE pantry_items SET status = 'consumed', updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [itemId, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function openItem(userId: string, itemId: string): Promise<PantryItem | null> {
  const { rows } = await query(
    `UPDATE pantry_items
     SET status = 'opened', opened_date = CURRENT_DATE, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [itemId, userId]
  );
  return rows[0] || null;
}

export async function discardItem(userId: string, itemId: string): Promise<boolean> {
  const { rowCount } = await query(
    `UPDATE pantry_items SET status = 'discarded', updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [itemId, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function getPantryStats(userId: string) {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status NOT IN ('consumed','discarded')) as total,
       COUNT(*) FILTER (WHERE expiration_date <= CURRENT_DATE + 3
                          AND expiration_date >= CURRENT_DATE
                          AND status NOT IN ('consumed','discarded')) as expiring_soon,
       COUNT(*) FILTER (WHERE expiration_date < CURRENT_DATE
                          AND status NOT IN ('consumed','discarded')) as expired
     FROM pantry_items
     WHERE user_id = $1`,
    [userId]
  );
  return rows[0];
}

export async function getExpiringItems(userId: string, days = 3): Promise<PantryItem[]> {
  const { rows } = await query(
    `SELECT pi.*, pl.name as location_name
     FROM pantry_items pi
     LEFT JOIN pantry_locations pl ON pi.location_id = pl.id
     WHERE pi.user_id = $1
       AND pi.status NOT IN ('consumed', 'discarded')
       AND pi.expiration_date <= CURRENT_DATE + $2::INT
       AND pi.expiration_date >= CURRENT_DATE
     ORDER BY pi.expiration_date ASC`,
    [userId, days]
  );
  return rows;
}

export async function getProductHistory(userId: string): Promise<unknown[]> {
  const { rows } = await query(
    `SELECT uph.*, p.image_url, p.default_unit
     FROM user_product_history uph
     LEFT JOIN products p ON uph.product_id = p.id
     WHERE uph.user_id = $1
     ORDER BY uph.last_used DESC
     LIMIT 20`,
    [userId]
  );
  return rows;
}
