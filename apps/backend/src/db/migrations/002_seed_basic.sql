-- ============================================================
-- KuchniApp — Dane startowe
-- ============================================================

-- Baza wiedzy o terminach przydatności po otwarciu
INSERT INTO product_shelf_life (category, product_name, location, days_shelf_life, notes) VALUES
  ('nabiał', 'mleko', 'fridge', 4, 'Po otwarciu przechowywać w lodówce'),
  ('nabiał', 'jogurt', 'fridge', 7, 'Po otwarciu'),
  ('nabiał', 'ser żółty', 'fridge', 14, 'Po otwarciu, opakować folią'),
  ('nabiał', 'śmietana', 'fridge', 7, 'Po otwarciu'),
  ('nabiał', 'masło', 'fridge', 30, 'Po otwarciu'),
  ('nabiał', 'twaróg', 'fridge', 5, 'Po otwarciu'),
  ('mięso', 'kurczak surowy', 'fridge', 2, 'Surowe mięso drobiowe'),
  ('mięso', 'wołowina surowa', 'fridge', 3, 'Surowe mięso wołowe'),
  ('mięso', 'wieprzowina surowa', 'fridge', 3, 'Surowe mięso wieprzowe'),
  ('mięso', 'kurczak surowy', 'freezer', 90, 'W zamrażarce'),
  ('mięso', 'wołowina surowa', 'freezer', 120, 'W zamrażarce'),
  ('pieczywo', 'chleb', 'pantry', 5, 'W temperaturze pokojowej'),
  ('pieczywo', 'bułki', 'pantry', 2, 'W temperaturze pokojowej'),
  ('owoce', 'truskawki', 'fridge', 3, 'W lodówce'),
  ('owoce', 'maliny', 'fridge', 2, 'W lodówce'),
  ('warzywa', 'sałata', 'fridge', 5, 'W lodówce'),
  ('warzywa', 'szpinak', 'fridge', 3, 'W lodówce'),
  ('napoje', 'sok owocowy', 'fridge', 7, 'Po otwarciu, w lodówce'),
  ('sosy', 'ketchup', 'fridge', 30, 'Po otwarciu, w lodówce'),
  ('sosy', 'majonez', 'fridge', 14, 'Po otwarciu, w lodówce')
ON CONFLICT DO NOTHING;
