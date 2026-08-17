// Category types whose pro form lets the pro check several subcategories at
// once (via SubcategoryMultiSelect) instead of a single primary one — e.g. a
// car rental agency offering several vehicle types, a hotel that also runs a
// restaurant/bar/nightclub/shop on-site, an activity provider offering
// several kinds of excursions, or a real estate agency listing several
// property types.
export const MULTI_SUBCATEGORY_TYPES = [
  "location-vehicules",
  "agences-immobilieres",
  "activite",
  "hebergement",
] as const;

export function hasMultiSubcategory(categoryType: string | undefined | null): boolean {
  return !!categoryType && (MULTI_SUBCATEGORY_TYPES as readonly string[]).includes(categoryType);
}
