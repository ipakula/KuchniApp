import { query } from '../db/connection';
import { MealPlanEntry, MealType, RecipeIngredient } from '../types';
import { getWeekStart, toISODate } from '../utils/date';
import { addMealPlanItemsToList } from './shopping.service';

export async function getMealPlan(userId: string, weekDate: Date): Promise<MealPlanEntry[]> {
  const weekStart = toISODate(getWeekStart(weekDate));

  const { rows: plan } = await query(
    `SELECT id FROM meal_plans WHERE user_id = $1 AND week_start = $2`,
    [userId, weekStart]
  );

  if (!plan[0]) return [];

  const { rows } = await query(
    `SELECT mpe.*, r.title as recipe_title, r.description as recipe_description,
            r.ingredients, r.instructions, r.servings as recipe_servings,
            r.prep_time_min, r.cook_time_min, r.diet_tags
     FROM meal_plan_entries mpe
     LEFT JOIN recipes r ON mpe.recipe_id = r.id
     WHERE mpe.meal_plan_id = $1
     ORDER BY mpe.meal_date ASC, mpe.meal_type ASC`,
    [plan[0].id]
  );

  return rows;
}

export async function addMealPlanEntry(
  userId: string,
  data: {
    mealDate: string;
    mealType: MealType;
    recipeId: string;
    servings?: number;
  }
): Promise<MealPlanEntry> {
  const weekStart = toISODate(getWeekStart(new Date(data.mealDate)));

  // Utwórz lub pobierz plan tygodniowy
  const { rows: plans } = await query(
    `INSERT INTO meal_plans (user_id, week_start)
     VALUES ($1, $2)
     ON CONFLICT (user_id, week_start) DO UPDATE SET week_start = EXCLUDED.week_start
     RETURNING id`,
    [userId, weekStart]
  );

  const mealPlanId = plans[0].id;

  const { rows } = await query(
    `INSERT INTO meal_plan_entries (meal_plan_id, recipe_id, meal_date, meal_type, servings)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (meal_plan_id, meal_date, meal_type)
     DO UPDATE SET recipe_id = EXCLUDED.recipe_id, servings = EXCLUDED.servings
     RETURNING *`,
    [mealPlanId, data.recipeId, data.mealDate, data.mealType, data.servings || 2]
  );

  // Pobierz składniki przepisu i dodaj brakujące do listy zakupów
  const { rows: recipeRows } = await query(
    'SELECT ingredients FROM recipes WHERE id = $1 AND user_id = $2',
    [data.recipeId, userId]
  );

  if (recipeRows[0]?.ingredients) {
    const ingredients: RecipeIngredient[] = Array.isArray(recipeRows[0].ingredients)
      ? recipeRows[0].ingredients
      : JSON.parse(recipeRows[0].ingredients);

    // Sprawdź co jest w spiżarni
    const pantryNames = await getPantryIngredientNames(userId);

    const missing = ingredients.filter(
      (ing) => !pantryNames.some((pn) => pn.toLowerCase().includes(ing.name.toLowerCase()))
    );

    if (missing.length > 0) {
      await addMealPlanItemsToList(userId, missing, mealPlanId);
    }
  }

  return rows[0];
}

async function getPantryIngredientNames(userId: string): Promise<string[]> {
  const { rows } = await query(
    `SELECT name FROM pantry_items
     WHERE user_id = $1 AND status NOT IN ('consumed', 'discarded')`,
    [userId]
  );
  return rows.map((r) => r.name);
}

export async function deleteMealPlanEntry(
  userId: string,
  entryId: string
): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM meal_plan_entries mpe
     USING meal_plans mp
     WHERE mpe.id = $1
       AND mpe.meal_plan_id = mp.id
       AND mp.user_id = $2`,
    [entryId, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function markMealCooked(
  userId: string,
  entryId: string
): Promise<MealPlanEntry | null> {
  const { rows } = await query(
    `UPDATE meal_plan_entries mpe
     SET status = 'cooked', cooked_at = NOW()
     FROM meal_plans mp
     WHERE mpe.id = $1
       AND mpe.meal_plan_id = mp.id
       AND mp.user_id = $2
     RETURNING mpe.*`,
    [entryId, userId]
  );

  if (!rows[0]) return null;

  // Pobierz składniki i oznacz zużyte w spiżarni
  const { rows: recipeRows } = await query(
    'SELECT ingredients FROM recipes WHERE id = $1',
    [rows[0].recipe_id]
  );

  if (recipeRows[0]?.ingredients) {
    const ingredients: RecipeIngredient[] = Array.isArray(recipeRows[0].ingredients)
      ? recipeRows[0].ingredients
      : JSON.parse(recipeRows[0].ingredients);

    for (const ing of ingredients) {
      // Zmniejsz ilość lub oznacz jako skonsumowane
      await query(
        `UPDATE pantry_items
         SET quantity = GREATEST(0, quantity - $3),
             status = CASE WHEN quantity - $3 <= 0 THEN 'consumed' ELSE status END,
             updated_at = NOW()
         WHERE user_id = $1
           AND LOWER(name) LIKE LOWER($2)
           AND status NOT IN ('consumed', 'discarded')
         LIMIT 1`,
        [userId, `%${ing.name}%`, ing.quantity || 1]
      );
    }
  }

  return rows[0];
}

export async function getMissingIngredients(userId: string, weekDate: Date) {
  const entries = await getMealPlan(userId, weekDate);
  const pantryNames = await getPantryIngredientNames(userId);
  const missing: Array<{ ingredient: string; recipe: string }> = [];

  for (const entry of entries) {
    if (!entry.ingredients) continue;
    const ingredients: RecipeIngredient[] = Array.isArray(entry.ingredients)
      ? entry.ingredients
      : JSON.parse(entry.ingredients as unknown as string);

    for (const ing of ingredients) {
      const inPantry = pantryNames.some((pn) =>
        pn.toLowerCase().includes(ing.name.toLowerCase())
      );
      if (!inPantry) {
        missing.push({ ingredient: ing.name, recipe: entry.recipe_title || 'Nieznany przepis' });
      }
    }
  }

  return missing;
}
