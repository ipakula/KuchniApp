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
export async function generateShoppingSuggestions(
  lowStockItems: string[],
  missingBasicItems: string[],
  upcomingMeals: string[]
): Promise<string[]> {
  const prompt = `Jesteś asystentem kuchennym. Na podstawie poniższych danych zasugeruj produkty do kupienia.

Produkty o niskim stanie: ${lowStockItems.join(', ') || 'brak'}
Brakujące produkty podstawowe: ${missingBasicItems.join(', ') || 'brak'}
Planowane posiłki w tym tygodniu: ${upcomingMeals.join(', ') || 'brak'}

Odpowiedz TYLKO w formacie JSON: { "suggestions": ["produkt1", "produkt2"] }
Maksymalnie 10 pozycji, po polsku.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });

  const content = response.choices[0].message.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  return parsed.suggestions || [];
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
