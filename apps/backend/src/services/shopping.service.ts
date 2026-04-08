import { query } from '../db/connection';
import { ShoppingItem } from '../types';

async function ensureActiveList(userId: string): Promise<string> {
  let { rows } = await query(
    'SELECT id FROM shopping_lists WHERE user_id = $1 AND is_active = true LIMIT 1',
    [userId]
  );
  if (rows[0]) return rows[0].id;

  const { rows: created } = await query(
    `INSERT INTO shopping_lists (user_id, name, is_active)
     VALUES ($1, 'Moja lista zakupów', true)
     RETURNING id`,
    [userId]
  );
  return created[0].id;
}

export async function getShoppingList(userId: string): Promise<ShoppingItem[]> {
  const { rows } = await query(
    `SELECT si.*
     FROM shopping_items si
     JOIN shopping_lists sl ON si.shopping_list_id = sl.id
     WHERE sl.user_id = $1 AND sl.is_active = true
     ORDER BY si.is_checked ASC, si.category ASC, si.added_at ASC`,
    [userId]
  );
  return rows;
}

export async function addShoppingItem(
  userId: string,
  data: Partial<ShoppingItem>
): Promise<ShoppingItem> {
  const listId = await ensureActiveList(userId);
  const { rows } = await query(
    `INSERT INTO shopping_items
       (shopping_list_id, product_id, name, quantity, unit, category, source, meal_plan_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      listId,
      data.product_id || null,
      data.name,
      data.quantity || 1,
      data.unit || 'szt',
      data.category || null,
      data.source || 'manual',
      data.meal_plan_id || null,
    ]
  );
  return rows[0];
}

export async function updateShoppingItem(
  userId: string,
  itemId: string,
  data: Partial<ShoppingItem>
): Promise<ShoppingItem | null> {
  const { rows } = await query(
    `UPDATE shopping_items si
     SET name = COALESCE($3, si.name),
         quantity = COALESCE($4, si.quantity),
         unit = COALESCE($5, si.unit),
         category = COALESCE($6, si.category)
     FROM shopping_lists sl
     WHERE si.id = $1
       AND si.shopping_list_id = sl.id
       AND sl.user_id = $2
     RETURNING si.*`,
    [itemId, userId, data.name, data.quantity, data.unit, data.category]
  );
  return rows[0] || null;
}

export async function deleteShoppingItem(userId: string, itemId: string): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM shopping_items si
     USING shopping_lists sl
     WHERE si.id = $1
       AND si.shopping_list_id = sl.id
       AND sl.user_id = $2`,
    [itemId, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function checkItem(userId: string, itemId: string): Promise<ShoppingItem | null> {
  const { rows } = await query(
    `UPDATE shopping_items si
     SET is_checked = NOT si.is_checked,
         checked_at = CASE WHEN si.is_checked THEN NULL ELSE NOW() END
     FROM shopping_lists sl
     WHERE si.id = $1
       AND si.shopping_list_id = sl.id
       AND sl.user_id = $2
     RETURNING si.*`,
    [itemId, userId]
  );
  return rows[0] || null;
}

export async function clearCheckedItems(userId: string): Promise<void> {
  await query(
    `DELETE FROM shopping_items si
     USING shopping_lists sl
     WHERE si.shopping_list_id = sl.id
       AND sl.user_id = $1
       AND si.is_checked = true`,
    [userId]
  );
}

export async function addMealPlanItemsToList(
  userId: string,
  ingredients: Array<{ name: string; quantity?: number; unit?: string; category?: string }>,
  mealPlanId: string
): Promise<void> {
  const listId = await ensureActiveList(userId);
  for (const ing of ingredients) {
    // Sprawdź czy produkt nie jest już na liście
    const { rows: existing } = await query(
      `SELECT id FROM shopping_items
       WHERE shopping_list_id = $1 AND LOWER(name) = LOWER($2) AND is_checked = false`,
      [listId, ing.name]
    );
    if (existing.length > 0) continue;

    await query(
      `INSERT INTO shopping_items
         (shopping_list_id, name, quantity, unit, category, source, meal_plan_id)
       VALUES ($1,$2,$3,$4,$5,'meal_plan',$6)`,
      [listId, ing.name, ing.quantity || 1, ing.unit || 'szt', ing.category || null, mealPlanId]
    );
  }
}
