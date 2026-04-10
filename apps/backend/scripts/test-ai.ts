/**
 * Test AI funkcji bezpośrednio (bez HTTP, bez auth)
 * Uruchom: npx ts-node scripts/test-ai.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  generateRecipe,
  generateShoppingSuggestions,
  suggestCategory,
  suggestExpiration,
} from '../src/services/ai.service';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const BOLD  = '\x1b[1m';

function ok(msg: string) { console.log(`${GREEN}✓${RESET} ${msg}`); }
function fail(msg: string, err: unknown) {
  console.log(`${RED}✗${RESET} ${msg}`);
  console.error('  ', err instanceof Error ? err.message : err);
}
function section(title: string) {
  console.log(`\n${BOLD}${CYAN}═══ ${title} ═══${RESET}`);
}

async function testGenerateRecipe() {
  section('generateRecipe (gpt-4o)');
  try {
    const recipe = await generateRecipe({
      pantryIngredients: ['jajka', 'mąka', 'mleko', 'masło', 'cukier', 'sól'],
      mealType: 'sniadanie',
      servings: 2,
    });

    // Validate shape
    const errors: string[] = [];
    if (!recipe.title)                              errors.push('brak title');
    if (!recipe.description)                        errors.push('brak description');
    if (typeof recipe.prepTimeMins !== 'number')    errors.push('prepTimeMins nie jest liczbą');
    if (typeof recipe.cookTimeMins !== 'number')    errors.push('cookTimeMins nie jest liczbą');
    if (!Array.isArray(recipe.ingredients))         errors.push('ingredients nie jest tablicą');
    if (!Array.isArray(recipe.instructions))        errors.push('instructions nie jest tablicą');
    if (recipe.ingredients.length === 0)            errors.push('brak składników');
    if (recipe.instructions.length === 0)           errors.push('brak instrukcji');

    // Validate ingredient shape
    for (const ing of recipe.ingredients) {
      if (!ing.name)                errors.push(`składnik bez name: ${JSON.stringify(ing)}`);
      if (typeof ing.quantity !== 'number') errors.push(`składnik bez quantity: ${ing.name}`);
      if (!ing.unit)                errors.push(`składnik bez unit: ${ing.name}`);
    }

    // Validate instruction shape
    for (const inst of recipe.instructions) {
      if (typeof inst.step !== 'number')    errors.push(`krok bez numeru: ${JSON.stringify(inst)}`);
      if (!inst.description)                errors.push(`krok bez opisu: step ${inst.step}`);
    }

    if (errors.length > 0) {
      fail('Przepis ma błędy struktury:', errors.join(', '));
    } else {
      ok(`Wygenerowano: "${recipe.title}"`);
      ok(`Czas: ${recipe.prepTimeMins} min przygotowania + ${recipe.cookTimeMins} min gotowania`);
      ok(`Składniki (${recipe.ingredients.length}): ${recipe.ingredients.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}`);
      ok(`Kroki: ${recipe.instructions.length}`);
      if (recipe.dietTags?.length) ok(`Tagi diety: ${recipe.dietTags.join(', ')}`);
    }
  } catch (err) {
    fail('generateRecipe rzucił błąd', err);
  }
}

async function testSuggestCategory() {
  section('suggestCategory (gpt-4o-mini)');
  const cases = [
    { product: 'Mleko UHT 3,2%', expected: 'nabiał' },
    { product: 'Pierś z kurczaka', expected: 'mięso' },
    { product: 'Makaron spaghetti', expected: 'makarony i ryż' },
  ];

  for (const { product, expected } of cases) {
    try {
      const category = await suggestCategory(product);
      if (category === expected) {
        ok(`"${product}" → "${category}"`);
      } else {
        // Not a hard fail — AI might use slightly different label
        console.log(`  ⚠  "${product}" → "${category}" (oczekiwano: "${expected}")`);
      }
    } catch (err) {
      fail(`suggestCategory("${product}")`, err);
    }
  }
}

async function testSuggestExpiration() {
  section('suggestExpiration (gpt-4o-mini)');
  const cases: Array<{ product: string; status: 'opened' | 'unopened' }> = [
    { product: 'Mleko UHT', status: 'opened' },
    { product: 'Jogurt naturalny', status: 'unopened' },
  ];

  for (const { product, status } of cases) {
    try {
      const result = await suggestExpiration(product, status);
      if (typeof result.days !== 'number' || !result.notes) {
        fail(`Zły format dla "${product}"`, result);
      } else {
        ok(`"${product}" (${status}) → ${result.days} dni — "${result.notes}"`);
      }
    } catch (err) {
      fail(`suggestExpiration("${product}", "${status}")`, err);
    }
  }
}

async function testShoppingSuggestions() {
  section('generateShoppingSuggestions (gpt-4o-mini)');
  try {
    const result = await generateShoppingSuggestions(
      ['masło (50 g)', 'mleko (100 ml)'],
      ['chleb', 'jajka'],
      ['makaron bolognese', 'zupa pomidorowa']
    );

    if (!Array.isArray(result)) {
      fail('Wynik nie jest tablicą', result);
      return;
    }
    if (result.length === 0) {
      fail('Brak sugestii zakupów', result);
      return;
    }

    const validReasons = ['low_stock', 'missing_basic', 'meal_plan', 'ai'];
    const errors: string[] = [];
    for (const s of result) {
      if (!s.name) errors.push(`brak name: ${JSON.stringify(s)}`);
      if (!validReasons.includes(s.reason)) errors.push(`nieznany reason "${s.reason}" dla "${s.name}"`);
    }

    if (errors.length > 0) {
      fail('Sugestie mają błędy:', errors.join('; '));
    } else {
      ok(`Zwrócono ${result.length} sugestii:`);
      for (const s of result) {
        console.log(`     • ${s.name} [${s.reason}]${s.category ? ` (${s.category})` : ''}`);
      }
    }
  } catch (err) {
    fail('generateShoppingSuggestions rzucił błąd', err);
  }
}

async function main() {
  console.log(`${BOLD}KuchniApp AI Test Suite${RESET}`);
  console.log(`OpenAI key: ${process.env.OPENAI_API_KEY ? '***' + process.env.OPENAI_API_KEY.slice(-4) : 'BRAK!'}\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error(`${RED}OPENAI_API_KEY nie jest ustawiony w .env${RESET}`);
    process.exit(1);
  }

  await testSuggestCategory();
  await testSuggestExpiration();
  await testShoppingSuggestions();
  await testGenerateRecipe(); // ostatni — najdłuższy i najdroższy

  console.log(`\n${BOLD}Gotowe.${RESET}\n`);
}

main().catch((err) => {
  console.error('Nieoczekiwany błąd:', err);
  process.exit(1);
});
