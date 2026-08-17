export function buildSubcategoryMap(rows: { slug: string; name: Record<string, string> }[]) {
  return Object.fromEntries(rows.map((r) => [r.slug, r.name]));
}

export function subcategoryLabel(map: Record<string, Record<string, string>>, slug: string, locale: string) {
  return map[slug]?.[locale] ?? map[slug]?.fr ?? slug;
}

// Flattens every category's subcategories into a single deduplicated list —
// used as the option pool for the "other activities on-site" tag picker, so a
// hotel with a restaurant/spa/boutique can tag them without a hardcoded list
// that drifts from the real category/subcategory tree.
export function flattenSubcategories(
  categories: { id: number }[],
  subcategoriesByCategory: Record<number, { slug: string; name: Record<string, string> }[]>
) {
  const seen = new Set<string>();
  const result: { slug: string; name: Record<string, string> }[] = [];
  for (const c of categories) {
    for (const s of subcategoriesByCategory[c.id] ?? []) {
      if (seen.has(s.slug)) continue;
      seen.add(s.slug);
      result.push(s);
    }
  }
  return result;
}

// priceLevel is stored internally as "€"/"€€"/"€€€" tier keys (legacy), but the
// site's currency is the Moroccan dirham, so we always display it as Dh tiers.
export const PRICE_LEVELS = ["€", "€€", "€€€"] as const;

const PRICE_LEVEL_LABELS: Record<string, string> = {
  "€": "Dh",
  "€€": "Dh Dh",
  "€€€": "Dh Dh Dh",
};

export function priceLevelLabel(level?: string | null) {
  if (!level) return "";
  return PRICE_LEVEL_LABELS[level] ?? level;
}
