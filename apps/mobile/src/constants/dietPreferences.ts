export const DIET_PREFERENCES = [
  { value: 'none', label: 'Bez ograniczeń', icon: '🍽️', description: 'Brak specjalnych wymagań' },
  { value: 'vegetarian', label: 'Wegetariańska', icon: '🥦', description: 'Bez mięsa i ryb' },
  { value: 'vegan', label: 'Wegańska', icon: '🌱', description: 'Bez produktów odzwierzęcych' },
  { value: 'gluten_free', label: 'Bezglutenowa', icon: '🌾', description: 'Bez pszenicy, żyta, jęczmienia' },
  { value: 'lactose_free', label: 'Bez laktozy', icon: '🥛', description: 'Bez nabiału z laktozą' },
] as const;

export const KITCHEN_EQUIPMENT = [
  { value: 'piekarnik', label: 'Piekarnik' },
  { value: 'mikrofala', label: 'Mikrofalówka' },
  { value: 'airfryer', label: 'Air Fryer' },
  { value: 'thermomix', label: 'Thermomix' },
  { value: 'multicooker', label: 'Multicooker' },
  { value: 'grill', label: 'Grill' },
  { value: 'blender', label: 'Blender' },
] as const;

export const MEAL_TYPE_LABELS = {
  sniadanie: 'Śniadanie',
  obiad: 'Obiad',
  kolacja: 'Kolacja',
} as const;

export const MEAL_TYPE_ICONS = {
  sniadanie: '🌅',
  obiad: '☀️',
  kolacja: '🌙',
} as const;
