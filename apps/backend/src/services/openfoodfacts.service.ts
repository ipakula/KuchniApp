import axios from 'axios';
import { config } from '../config';

interface OpenFoodFactsProduct {
  barcode: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
}

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2';

const categoryMap: Record<string, string> = {
  'en:dairy': 'nabiał',
  'en:dairies': 'nabiał',
  'en:milks': 'nabiał',
  'en:cheeses': 'nabiał',
  'en:yogurts': 'nabiał',
  'en:meats': 'mięso',
  'en:chicken': 'mięso',
  'en:beef': 'mięso',
  'en:pork': 'mięso',
  'en:breads': 'pieczywo',
  'en:bread': 'pieczywo',
  'en:beverages': 'napoje',
  'en:juices': 'napoje',
  'en:waters': 'napoje',
  'en:vegetables': 'warzywa',
  'en:fruits': 'owoce',
  'en:frozen-foods': 'mrożonki',
  'en:snacks': 'przekąski',
  'en:cereals': 'płatki i zbożowe',
  'en:pasta': 'makarony i ryż',
  'en:rice': 'makarony i ryż',
  'en:sauces': 'sosy i przyprawy',
  'en:condiments': 'sosy i przyprawy',
  'en:sweets': 'słodycze',
  'en:chocolates': 'słodycze',
  'en:fish': 'ryby i owoce morza',
  'en:seafood': 'ryby i owoce morza',
  'en:canned-foods': 'konserwy',
  'en:eggs': 'jaja',
};

function mapCategory(tags: string[] = []): string {
  for (const tag of tags) {
    const mapped = categoryMap[tag.toLowerCase()];
    if (mapped) return mapped;
  }
  return 'inne';
}

export async function getProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const { data } = await axios.get(`${OFF_BASE}/product/${barcode}`, {
      params: {
        fields: 'code,product_name,product_name_pl,brands,categories_tags,image_url',
      },
      headers: {
        'User-Agent': config.openFoodFacts.userAgent,
      },
      timeout: 5000,
    });

    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const name = p.product_name_pl || p.product_name || null;

    return {
      barcode: p.code || barcode,
      name,
      brand: p.brands ? p.brands.split(',')[0].trim() : null,
      category: mapCategory(p.categories_tags || []),
      imageUrl: p.image_url || null,
    };
  } catch (err) {
    console.error('[OpenFoodFacts] Błąd pobierania produktu:', err);
    return null;
  }
}
