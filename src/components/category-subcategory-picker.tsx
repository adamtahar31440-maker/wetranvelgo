"use client";

import { useEffect, useState } from "react";

type Category = { id: number; name: Record<string, string> };
type Subcategory = { slug: string; name: Record<string, string> };

const OTHER_VALUE = "__other__";

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export function CategorySubcategoryPicker({
  categories,
  subcategoriesByCategory,
  locale = "fr",
  defaultCategoryId,
  defaultSubcategory,
  categoryRef,
  categoryLabel = "Catégorie",
  subcategoryLabel = "Sous-catégorie",
  otherLabel = "Autre",
  otherPlaceholder = "Précisez votre activité",
  onCategoryChange,
  hideSubcategory = false,
}: {
  categories: Category[];
  subcategoriesByCategory: Record<number, Subcategory[]>;
  locale?: string;
  defaultCategoryId?: number;
  defaultSubcategory?: string;
  categoryRef?: React.RefObject<HTMLSelectElement | null>;
  categoryLabel?: string;
  subcategoryLabel?: string;
  otherLabel?: string;
  otherPlaceholder?: string;
  // The picker owns its own categoryId state (needed for the subcategory list),
  // but a parent form that wants to render different fields per category (e.g.
  // car-rental-only fields, or the digital catalog section's per-category
  // label) has no other way to know it — notified on every change and once
  // on mount so the parent can initialize.
  onCategoryChange?: (id: number) => void;
  // Categories that let the pro pick several subcategories at once (via
  // SubcategoryMultiSelect elsewhere in the form, e.g. car rental) don't need
  // this single-select at all — the multi-select fully replaces it, and the
  // "primary" subcategory is derived server-side from the first checked value.
  hideSubcategory?: boolean;
}) {
  const [categoryId, setCategoryId] = useState<number>(defaultCategoryId ?? categories[0]?.id);
  const subs = subcategoriesByCategory[categoryId] ?? [];
  const defaultIsKnown = !!defaultSubcategory && subs.some((s) => s.slug === defaultSubcategory);
  const defaultIsOther = !!defaultSubcategory && !defaultIsKnown;
  const [subcategory, setSubcategory] = useState<string>(
    defaultIsKnown ? defaultSubcategory! : defaultIsOther ? OTHER_VALUE : subs[0]?.slug ?? ""
  );
  const [otherText, setOtherText] = useState<string>(defaultIsOther ? defaultSubcategory! : "");

  useEffect(() => {
    onCategoryChange?.(categoryId);
    // Only the initial mount needs this — every later change already goes
    // through handleCategoryChange below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCategoryChange(id: number) {
    setCategoryId(id);
    const next = subcategoriesByCategory[id] ?? [];
    setSubcategory(next[0]?.slug ?? "");
    setOtherText("");
    onCategoryChange?.(id);
  }

  const submittedSubcategory = subcategory === OTHER_VALUE ? otherText : subcategory;

  return (
    <section className={hideSubcategory ? "" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
      <div>
        <label className={labelClass}>{categoryLabel}</label>
        <select
          name="categoryId"
          ref={categoryRef}
          value={categoryId}
          onChange={(e) => handleCategoryChange(Number(e.target.value))}
          className={inputClass}
          required
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[locale] ?? c.name.fr}
            </option>
          ))}
        </select>
      </div>
      {!hideSubcategory && (
        <div>
          <label className={labelClass}>{subcategoryLabel}</label>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className={inputClass}
            required
          >
            {subs.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name[locale] ?? s.name.fr}
              </option>
            ))}
            <option value={OTHER_VALUE}>{otherLabel}</option>
          </select>
          {subcategory === OTHER_VALUE && (
            <input
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder={otherPlaceholder}
              required
              className={`${inputClass} mt-2`}
            />
          )}
          <input type="hidden" name="subcategory" value={submittedSubcategory} />
        </div>
      )}
    </section>
  );
}
