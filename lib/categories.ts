export const CATEGORIES = [
  { label: 'Pokemon', value: 'pokemon' },
  { label: 'Sports', value: 'sports' },
  { label: 'Magic (MTG)', value: 'mtg' },
  { label: 'Other', value: 'other' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];
