export const UNITS = [
  { value: 'szt', label: 'szt.' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'opakowanie', label: 'opak.' },
  { value: 'łyżka', label: 'łyżka' },
  { value: 'łyżeczka', label: 'łyżeczka' },
  { value: 'szklanka', label: 'szklanka' },
] as const;

export const UNIT_LABELS: Record<string, string> = Object.fromEntries(
  UNITS.map((u) => [u.value, u.label])
);
