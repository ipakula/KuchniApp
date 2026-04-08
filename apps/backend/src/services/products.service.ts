import { query } from '../db/connection';
import { Product } from '../types';
import { getProductByBarcode as getFromOFF } from './openfoodfacts.service';

export async function findByBarcode(barcode: string): Promise<Product | null> {
  // 1. Sprawdź lokalną bazę
  const { rows } = await query(
    'SELECT * FROM products WHERE barcode = $1',
    [barcode]
  );
  if (rows[0]) return rows[0];

  // 2. Zapytaj OpenFoodFacts
  const offProduct = await getFromOFF(barcode);
  if (!offProduct || !offProduct.name) return null;

  // 3. Zapisz w lokalnej bazie i zwróć
  const { rows: inserted } = await query(
    `INSERT INTO products (barcode, name, brand, category, image_url, source)
     VALUES ($1, $2, $3, $4, $5, 'openfoodfacts')
     ON CONFLICT (barcode) DO UPDATE
       SET name = EXCLUDED.name,
           brand = EXCLUDED.brand,
           category = EXCLUDED.category,
           image_url = EXCLUDED.image_url
     RETURNING *`,
    [offProduct.barcode, offProduct.name, offProduct.brand, offProduct.category, offProduct.imageUrl]
  );

  return inserted[0];
}

export async function searchProducts(query_str: string): Promise<Product[]> {
  const { rows } = await query(
    `SELECT * FROM products
     WHERE name ILIKE $1 OR brand ILIKE $1
     ORDER BY
       CASE WHEN LOWER(name) = LOWER($2) THEN 0 ELSE 1 END,
       name
     LIMIT 20`,
    [`%${query_str}%`, query_str]
  );
  return rows;
}

export async function getProduct(id: string): Promise<Product | null> {
  const { rows } = await query('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const { rows } = await query(
    `INSERT INTO products
       (barcode, name, brand, category, default_unit, image_url,
        shelf_life_opened_days, shelf_life_unopened_days, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'manual')
     RETURNING *`,
    [
      data.barcode || null,
      data.name,
      data.brand || null,
      data.category || null,
      data.default_unit || 'szt',
      data.image_url || null,
      data.shelf_life_opened_days || null,
      data.shelf_life_unopened_days || null,
    ]
  );
  return rows[0];
}

export async function getCategories(): Promise<string[]> {
  const { rows } = await query(
    `SELECT DISTINCT category FROM products
     WHERE category IS NOT NULL
     ORDER BY category`
  );
  return rows.map((r) => r.category);
}
