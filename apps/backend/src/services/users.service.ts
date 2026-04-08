import { query } from '../db/connection';
import { User } from '../types';

const DEFAULT_LOCATIONS = [
  { name: 'Lodówka', icon: '🧊', sort_order: 0, is_default: true },
  { name: 'Zamrażarka', icon: '❄️', sort_order: 1, is_default: false },
  { name: 'Spiżarnia', icon: '🏠', sort_order: 2, is_default: false },
  { name: 'Szafka', icon: '🗄️', sort_order: 3, is_default: false },
];

const DEFAULT_BASIC_PRODUCTS = [
  { name: 'Mleko', category: 'nabiał', unit: 'l' },
  { name: 'Jajka', category: 'jaja', unit: 'szt' },
  { name: 'Chleb', category: 'pieczywo', unit: 'szt' },
  { name: 'Masło', category: 'nabiał', unit: 'szt' },
  { name: 'Ryż', category: 'makarony i ryż', unit: 'g' },
  { name: 'Makaron', category: 'makarony i ryż', unit: 'g' },
  { name: 'Ziemniaki', category: 'warzywa', unit: 'kg' },
];

export async function createUser(firebaseUid: string, email: string, displayName?: string): Promise<User> {
  const { rows } = await query(
    `INSERT INTO users (firebase_uid, email, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (firebase_uid) DO UPDATE
       SET email = EXCLUDED.email,
           display_name = COALESCE(EXCLUDED.display_name, users.display_name),
           updated_at = NOW()
     RETURNING *`,
    [firebaseUid, email, displayName || null]
  );
  const user = rows[0];

  // Utwórz domyślne lokalizacje
  await setupDefaultLocations(user.id);

  // Utwórz domyślne produkty bazowe
  await setupDefaultBasicProducts(user.id);

  return user;
}

async function setupDefaultLocations(userId: string) {
  const { rows: existing } = await query(
    'SELECT id FROM pantry_locations WHERE user_id = $1',
    [userId]
  );
  if (existing.length > 0) return;

  for (const loc of DEFAULT_LOCATIONS) {
    await query(
      `INSERT INTO pantry_locations (user_id, name, icon, sort_order, is_default)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, loc.name, loc.icon, loc.sort_order, loc.is_default]
    );
  }
}

async function setupDefaultBasicProducts(userId: string) {
  const { rows: existing } = await query(
    'SELECT id FROM user_basic_products WHERE user_id = $1',
    [userId]
  );
  if (existing.length > 0) return;

  for (const prod of DEFAULT_BASIC_PRODUCTS) {
    await query(
      `INSERT INTO user_basic_products (user_id, name, category, unit)
       VALUES ($1, $2, $3, $4)`,
      [userId, prod.name, prod.category, prod.unit]
    );
  }
}

export async function getUser(userId: string): Promise<User | null> {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId]);
  return rows[0] || null;
}

export async function updateUser(userId: string, data: Partial<User>): Promise<User | null> {
  const { rows } = await query(
    `UPDATE users
     SET display_name = COALESCE($2, display_name),
         household_size = COALESCE($3, household_size),
         diet_preference = COALESCE($4, diet_preference),
         kitchen_equipment = COALESCE($5, kitchen_equipment),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      userId,
      data.display_name,
      data.household_size,
      data.diet_preference,
      data.kitchen_equipment ? JSON.stringify(data.kitchen_equipment) : null,
    ]
  );
  return rows[0] || null;
}

export async function getLocations(userId: string) {
  const { rows } = await query(
    'SELECT * FROM pantry_locations WHERE user_id = $1 ORDER BY sort_order',
    [userId]
  );
  return rows;
}

export async function getBasicProducts(userId: string) {
  const { rows } = await query(
    'SELECT * FROM user_basic_products WHERE user_id = $1 AND is_active = true ORDER BY name',
    [userId]
  );
  return rows;
}

export async function savePushToken(userId: string, token: string, platform?: string): Promise<void> {
  await query(
    `INSERT INTO push_tokens (user_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id`,
    [userId, token, platform || null]
  );
}

export async function deleteUser(userId: string): Promise<void> {
  await query('DELETE FROM users WHERE id = $1', [userId]);
}
