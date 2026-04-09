-- Migration 003: Remove brand column from pantry_items
-- Rationale: brand is already stored in the products catalog (from OpenFoodFacts).
-- Users don't enter brand manually — it added noise without value.

ALTER TABLE pantry_items DROP COLUMN IF EXISTS brand;
