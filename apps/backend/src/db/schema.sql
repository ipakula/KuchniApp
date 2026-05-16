-- ============================================================
-- KuchniApp — Kompletny schemat bazy danych
-- Idempotentny: można uruchomić na czystej lub istniejącej bazie
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UŻYTKOWNICY
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid     VARCHAR(128) UNIQUE NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  display_name     VARCHAR(100),
  household_size   INT DEFAULT 2,
  diet_preference  VARCHAR(50) DEFAULT 'none',
  kitchen_equipment JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUKTY (katalog globalny / OpenFoodFacts)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode                  VARCHAR(50) UNIQUE,
  name                     VARCHAR(200) NOT NULL,
  brand                    VARCHAR(100),
  category                 VARCHAR(100),
  default_unit             VARCHAR(20) DEFAULT 'szt',
  image_url                TEXT,
  source                   VARCHAR(20) DEFAULT 'manual',
  shelf_life_unopened_days INT,
  shelf_life_opened_days   INT,
  shelf_life_fridge_days   INT,
  shelf_life_freezer_days  INT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOKALIZACJE SPIŻARNI (per użytkownik)
-- ============================================================
CREATE TABLE IF NOT EXISTS pantry_locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  icon       VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- POZYCJE SPIŻARNI (bez kolumny brand — usunięta w migr. 003)
-- ============================================================
CREATE TABLE IF NOT EXISTS pantry_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id),
  location_id     UUID REFERENCES pantry_locations(id),
  name            VARCHAR(200) NOT NULL,
  barcode         VARCHAR(50),
  category        VARCHAR(100),
  quantity        DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit            VARCHAR(20) DEFAULT 'szt',
  status          VARCHAR(20) DEFAULT 'unopened',
  expiration_date DATE,
  opened_date     DATE,
  days_after_open INT,
  notes           TEXT,
  added_from      VARCHAR(20) DEFAULT 'manual',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Usuń kolumnę brand jeśli istnieje (z poprzednich wersji schematu)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pantry_items' AND column_name = 'brand'
  ) THEN
    ALTER TABLE pantry_items DROP COLUMN brand;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id    ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration ON pantry_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_status     ON pantry_items(status);

-- ============================================================
-- HISTORIA PRODUKTÓW UŻYTKOWNIKA
-- ============================================================
CREATE TABLE IF NOT EXISTS user_product_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name       VARCHAR(200),
  barcode    VARCHAR(50),
  last_used  TIMESTAMPTZ DEFAULT NOW(),
  use_count  INT DEFAULT 1,
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- BAZOWE PRODUKTY UŻYTKOWNIKA (lista kontrolna)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_basic_products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  category     VARCHAR(100),
  min_quantity DECIMAL(10,2) DEFAULT 1,
  unit         VARCHAR(20) DEFAULT 'szt',
  is_active    BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- LISTA ZAKUPÓW
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) DEFAULT 'Moja lista zakupów',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES products(id),
  name             VARCHAR(200) NOT NULL,
  quantity         DECIMAL(10,2) DEFAULT 1,
  unit             VARCHAR(20) DEFAULT 'szt',
  category         VARCHAR(100),
  is_checked       BOOLEAN DEFAULT FALSE,
  source           VARCHAR(30) DEFAULT 'manual',
  meal_plan_id     UUID,
  checked_at       TIMESTAMPTZ,
  added_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_list ON shopping_items(shopping_list_id);

-- ============================================================
-- RECEPTURY
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  servings      INT DEFAULT 2,
  prep_time_min INT,
  cook_time_min INT,
  diet_tags     JSONB DEFAULT '[]',
  ingredients   JSONB NOT NULL DEFAULT '[]',
  instructions  JSONB NOT NULL DEFAULT '[]',
  image_url     TEXT,
  source        VARCHAR(20) DEFAULT 'ai',
  ai_prompt     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);

-- ============================================================
-- PLANER POSIŁKÓW
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id    UUID REFERENCES recipes(id) ON DELETE SET NULL,
  meal_date    DATE NOT NULL,
  meal_type    VARCHAR(20) NOT NULL,
  servings     INT DEFAULT 2,
  status       VARCHAR(20) DEFAULT 'planned',
  cooked_at    TIMESTAMPTZ,
  UNIQUE(meal_plan_id, meal_date, meal_type)
);

CREATE INDEX IF NOT EXISTS idx_meal_entries_plan ON meal_plan_entries(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_date ON meal_plan_entries(meal_date);

-- ============================================================
-- POWIADOMIENIA
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type    VARCHAR(50) NOT NULL,
  title   VARCHAR(200) NOT NULL,
  body    TEXT,
  data    JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- TOKENY PUSH
-- ============================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  platform   VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BAZA WIEDZY O TERMINACH PRZYDATNOŚCI
-- ============================================================
CREATE TABLE IF NOT EXISTS product_shelf_life (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        VARCHAR(100),
  product_name    VARCHAR(255),
  location        VARCHAR(30),
  days_shelf_life INT NOT NULL,
  notes           TEXT
);

-- ============================================================
-- DANE STARTOWE — terminy przydatności
-- ============================================================
INSERT INTO product_shelf_life (category, product_name, location, days_shelf_life, notes) VALUES
  ('nabiał',   'mleko',              'fridge',   4,   'Po otwarciu przechowywać w lodówce'),
  ('nabiał',   'jogurt',             'fridge',   7,   'Po otwarciu'),
  ('nabiał',   'ser żółty',          'fridge',   14,  'Po otwarciu, opakować folią'),
  ('nabiał',   'śmietana',           'fridge',   7,   'Po otwarciu'),
  ('nabiał',   'masło',              'fridge',   30,  'Po otwarciu'),
  ('nabiał',   'twaróg',             'fridge',   5,   'Po otwarciu'),
  ('mięso',    'kurczak surowy',     'fridge',   2,   'Surowe mięso drobiowe'),
  ('mięso',    'wołowina surowa',    'fridge',   3,   'Surowe mięso wołowe'),
  ('mięso',    'wieprzowina surowa', 'fridge',   3,   'Surowe mięso wieprzowe'),
  ('mięso',    'kurczak surowy',     'freezer',  90,  'W zamrażarce'),
  ('mięso',    'wołowina surowa',    'freezer',  120, 'W zamrażarce'),
  ('pieczywo', 'chleb',              'pantry',   5,   'W temperaturze pokojowej'),
  ('pieczywo', 'bułki',              'pantry',   2,   'W temperaturze pokojowej'),
  ('owoce',    'truskawki',          'fridge',   3,   'W lodówce'),
  ('owoce',    'maliny',             'fridge',   2,   'W lodówce'),
  ('warzywa',  'sałata',             'fridge',   5,   'W lodówce'),
  ('warzywa',  'szpinak',            'fridge',   3,   'W lodówce'),
  ('napoje',   'sok owocowy',        'fridge',   7,   'Po otwarciu, w lodówce'),
  ('sosy',     'ketchup',            'fridge',   30,  'Po otwarciu, w lodówce'),
  ('sosy',     'majonez',            'fridge',   14,  'Po otwarciu, w lodówce')
ON CONFLICT DO NOTHING;
