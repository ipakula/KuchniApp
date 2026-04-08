import { query } from '../db/connection';
import { Recipe } from '../types';
import { generateRecipe as aiGenerate, RecipeRequest } from './ai.service';

export async function getUserRecipes(userId: string): Promise<Recipe[]> {
  const { rows } = await query(
    `SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getRecipe(userId: string, recipeId: string): Promise<Recipe | null> {
  const { rows } = await query(
    `SELECT * FROM recipes WHERE id = $1 AND user_id = $2`,
    [recipeId, userId]
  );
  return rows[0] || null;
}

export async function generateAndSaveRecipe(
  userId: string,
  request: RecipeRequest
): Promise<Recipe> {
  const generated = await aiGenerate(request);

  const { rows } = await query(
    `INSERT INTO recipes
       (user_id, title, description, servings, prep_time_min, cook_time_min,
        diet_tags, ingredients, instructions, source, ai_prompt)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ai',$10)
     RETURNING *`,
    [
      userId,
      generated.title,
      generated.description,
      request.servings,
      generated.prepTimeMins,
      generated.cookTimeMins,
      JSON.stringify(generated.dietTags || []),
      JSON.stringify(generated.ingredients),
      JSON.stringify(generated.instructions),
      `mealType:${request.mealType}, diet:${request.diet}`,
    ]
  );

  return rows[0];
}

export async function saveRecipe(userId: string, recipeData: Partial<Recipe>): Promise<Recipe> {
  const { rows } = await query(
    `INSERT INTO recipes
       (user_id, title, description, servings, prep_time_min, cook_time_min,
        diet_tags, ingredients, instructions, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'manual')
     RETURNING *`,
    [
      userId,
      recipeData.title,
      recipeData.description || null,
      recipeData.servings || 2,
      recipeData.prep_time_min || null,
      recipeData.cook_time_min || null,
      JSON.stringify(recipeData.diet_tags || []),
      JSON.stringify(recipeData.ingredients || []),
      JSON.stringify(recipeData.instructions || []),
    ]
  );
  return rows[0];
}

export async function deleteRecipe(userId: string, recipeId: string): Promise<boolean> {
  const { rowCount } = await query(
    'DELETE FROM recipes WHERE id = $1 AND user_id = $2',
    [recipeId, userId]
  );
  return (rowCount ?? 0) > 0;
}
