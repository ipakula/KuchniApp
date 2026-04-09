import OpenAI from 'openai';
import { config } from '../config';
import { RecipeIngredient, RecipeInstruction } from '../types';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// ============================================================
// Generator przepisów
// ============================================================
export interface RecipeRequest {
  pantryIngredients: string[];
  mealType: string;
  servings: number;
  diet?: string;
  preferences?: string;
  equipment?: string[];
}

export interface GeneratedRecipe {
  title: string;
  description: string;
  prepTimeMins: number;
  cookTimeMins: number;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  dietTags: string[];
}

export async function generateRecipe(req: RecipeRequest): Promise<GeneratedRecipe> {
  const mealTypeLabel = {
    sniadanie: 'śniadanie',
    obiad: 'obiad',
    kolacja: 'kolacja',
  }[req.mealType] || req.mealType;

  const prompt = `Jesteś polskim szefem kuchni. Wygeneruj przepis na ${mealTypeLabel} dla ${req.servings} ${req.servings === 1 ? 'osoby' : 'osób'}.

Dostępne składniki w spiżarni: ${req.pantryIngredients.join(', ')}.
${req.diet && req.diet !== 'none' ? `Dieta: ${req.diet}.` : ''}
${req.preferences ? `Preferencje: ${req.preferences}.` : ''}
${req.equipment?.length ? `Dostępny sprzęt kuchenny: ${req.equipment.join(', ')}.` : ''}

Odpowiedz TYLKO w formacie JSON (bez markdown, bez komentarzy):
{
  "title": "Nazwa przepisu",
  "description": "Krótki opis w 1-2 zdaniach",
  "prepTimeMins": 10,
  "cookTimeMins": 20,
  "ingredients": [
    { "name": "składnik", "quantity": 2, "unit": "szt" }
  ],
  "instructions": [
    { "step": 1, "description": "Opis kroku" }
  ],
  "dietTags": ["wegetariańskie"]
}

Zasady:
- Używaj składników z listy lub powszechnie dostępnych przypraw/soli/oleju
- Instrukcje pisz po polsku, jasno i krok po kroku
- Ilości podawaj w polskich jednostkach (g, ml, łyżka, łyżeczka, szklanka, szt)`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Brak odpowiedzi od AI');

  return JSON.parse(content) as GeneratedRecipe;
}

// ============================================================
// Sugestia terminu przydatności
// ============================================================
export async function suggestExpiration(
  productName: string,
  status: 'opened' | 'unopened'
): Promise<{ days: number; notes: string }> {
  const prompt = `Ile dni można bezpiecznie przechowywać produkt "${productName}" w stanie ${status === 'opened' ? 'otwartym (po otwarciu)' : 'nieotwartym'}?

Odpowiedz TYLKO w formacie JSON: { "days": liczba, "notes": "krótka wskazówka po polsku" }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 100,
  });

  const content = response.choices[0].message.content;
  if (!content) return { days: 7, notes: 'Przechowywać w lodówce' };

  return JSON.parse(content);
}

// ============================================================
// Sugestia kategorii produktu
// ============================================================
export async function suggestCategory(productName: string): Promise<string> {
  const prompt = `Do jakiej kategorii należy produkt spożywczy "${productName}"?

Wybierz JEDNĄ z: nabiał, mięso, ryby i owoce morza, warzywa, owoce, pieczywo, makarony i ryż, płatki i zbożowe, sosy i przyprawy, słodycze, przekąski, napoje, mrożonki, konserwy, jaja, inne.

Odpowiedz TYLKO w formacie JSON: { "category": "nazwa kategorii" }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 50,
  });

  const content = response.choices[0].message.content;
  if (!content) return 'inne';

  const parsed = JSON.parse(content);
  return parsed.category || 'inne';
}

// ============================================================
// Sugestie zakupów
// ============================================================
export interface ShoppingSuggestion {
  name: string;
  reason: 'low_stock' | 'missing_basic' | 'meal_plan' | 'ai';
  category?: string;
}

export async function generateShoppingSuggestions(
  lowStockItems: string[],
  missingBasicItems: string[],
  mealPlanMissing: string[]
): Promise<ShoppingSuggestion[]> {
  // Build deterministic suggestions first (no AI needed for these)
  const deterministic: ShoppingSuggestion[] = [];
  const seen = new Set<string>();

  for (const name of mealPlanMissing) {
    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); deterministic.push({ name, reason: 'meal_plan' }); }
  }
  for (const nameWithQty of lowStockItems) {
    // strip "(qty unit)" suffix for dedup
    const name = nameWithQty.replace(/\s*\(.*\)$/, '').trim();
    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); deterministic.push({ name, reason: 'low_stock' }); }
  }
  for (const name of missingBasicItems) {
    const key = name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); deterministic.push({ name, reason: 'missing_basic' }); }
  }

  // Ask AI to fill remaining slots with smart suggestions + categorize all
  const aiSlots = Math.max(0, 12 - deterministic.length);

  const prompt = `Jesteś asystentem kuchennym. Masz listę produktów do zasugerowania zakupu oraz opcjonalnie wolne miejsca na dodatkowe propozycje.

Produkty do zakupu (już określone):
${deterministic.length > 0 ? deterministic.map((s) => `- ${s.name} (powód: ${s.reason === 'meal_plan' ? 'potrzebny do przepisu' : s.reason === 'low_stock' ? 'niski stan' : 'brakujący podstawowy'})`).join('\n') : 'brak'}

${aiSlots > 0 ? `Dodaj maksymalnie ${aiSlots} własnych propozycji uzupełniających spiżarnię.` : 'Nie dodawaj własnych propozycji.'}

Dla każdego produktu (zarówno podanych jak i swoich propozycji) przypisz kategorię.

Odpowiedz TYLKO w formacie JSON:
{
  "items": [
    { "name": "nazwa produktu", "reason": "meal_plan|low_stock|missing_basic|ai", "category": "nabiał|mięso|warzywa|owoce|pieczywo|makarony i ryż|płatki i zbożowe|sosy i przyprawy|słodycze|przekąski|napoje|mrożonki|konserwy|jaja|inne" }
  ]
}

Maksymalnie 12 pozycji łącznie. Odpowiedz po polsku.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    });

    const content = response.choices[0].message.content;
    if (!content) return deterministic;

    const parsed = JSON.parse(content);
    return (parsed.items || []) as ShoppingSuggestion[];
  } catch {
    return deterministic;
  }
}

// ============================================================
// Analiza spiżarni
// ============================================================
export async function analyzePantry(
  items: Array<{ name: string; quantity: number; unit: string; expiration_date?: string }>
): Promise<{ summary: string; tips: string[] }> {
  const itemsList = items
    .map((i) => `${i.name} (${i.quantity} ${i.unit}${i.expiration_date ? `, ważne do ${i.expiration_date}` : ''})`)
    .join(', ');

  const prompt = `Przeanalizuj zawartość spiżarni i podaj krótkie wskazówki.

Produkty w spiżarni: ${itemsList}

Odpowiedz TYLKO w formacie JSON:
{
  "summary": "1-2 zdania ogólnego podsumowania po polsku",
  "tips": ["wskazówka1", "wskazówka2", "wskazówka3"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 400,
  });

  const content = response.choices[0].message.content;
  if (!content) return { summary: 'Spiżarnia gotowa do gotowania!', tips: [] };

  return JSON.parse(content);
}
