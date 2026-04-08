export const DIET_PREFERENCES = [
  { value: 'none', label: 'Bez ograniczeń' },
  { value: 'vegetarian', label: 'Wegetariańska' },
  { value: 'vegan', label: 'Wegańska' },
  { value: 'gluten_free', label: 'Bezglutenowa' },
  { value: 'lactose_free', label: 'Bez laktozy' },
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
