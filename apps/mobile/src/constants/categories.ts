export const CATEGORIES = [
  { value: 'nabiał', label: 'Nabiał', icon: '🥛' },
  { value: 'mięso', label: 'Mięso', icon: '🥩' },
  { value: 'ryby i owoce morza', label: 'Ryby', icon: '🐟' },
  { value: 'warzywa', label: 'Warzywa', icon: '🥦' },
  { value: 'owoce', label: 'Owoce', icon: '🍎' },
  { value: 'pieczywo', label: 'Pieczywo', icon: '🍞' },
  { value: 'makarony i ryż', label: 'Makarony i ryż', icon: '🍝' },
  { value: 'płatki i zbożowe', label: 'Płatki i zbożowe', icon: '🌾' },
  { value: 'sosy i przyprawy', label: 'Sosy i przyprawy', icon: '🧂' },
  { value: 'słodycze', label: 'Słodycze', icon: '🍬' },
  { value: 'przekąski', label: 'Przekąski', icon: '🥜' },
  { value: 'napoje', label: 'Napoje', icon: '🧃' },
  { value: 'mrożonki', label: 'Mrożonki', icon: '🧊' },
  { value: 'konserwy', label: 'Konserwy', icon: '🥫' },
  { value: 'jaja', label: 'Jaja', icon: '🥚' },
  { value: 'inne', label: 'Inne', icon: '🛒' },
] as const;

export const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.icon])
);

export type CategoryValue = (typeof CATEGORIES)[number]['value'];
