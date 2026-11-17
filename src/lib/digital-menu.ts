import type { DigitalMenuItem } from "@/lib/menu-types";

// Shared by the pro dashboard (updateOwnEstablishment) and the admin fiche
// (upsertEstablishment) so both save and translate the digital menu the same way.

export type MenuItemInput = {
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  variants: { label: string; price: number }[] | null;
  photo: string | null;
};

export function parseMenuItems(raw: FormDataEntryValue | null): MenuItemInput[] {
  try {
    return JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
}

// Key order and null-vs-[] here must match MenuEditor's own serialization
// (name, description, category, price, variants, photo) exactly — the
// unchanged-check compares via JSON.stringify, which is sensitive to both.
export function storedMenuToInput(menu: DigitalMenuItem[] | null | undefined): MenuItemInput[] {
  return (menu ?? []).map((it) => ({
    name: it.name.fr,
    description: it.description?.fr ?? null,
    category: it.category?.fr ?? null,
    price: it.price,
    variants: it.variants && it.variants.length > 0 ? it.variants.map((v) => ({ label: v.label.fr, price: v.price })) : null,
    photo: it.photo ?? null,
  }));
}

export function isMenuUnchanged(input: MenuItemInput[], stored: DigitalMenuItem[] | null | undefined) {
  return JSON.stringify(input) === JSON.stringify(storedMenuToInput(stored));
}

// Category names and variant labels ("Plats principaux", "Verre"...) repeat
// identically across many items — translating each occurrence as its own
// field bloated the request enough (more fields/chars per chunk than
// translateFields' size limits comfortably allow) that a large category's
// whole chunk could silently fail and leave it and its dishes untranslated.
// Deduping by text means one translation call per unique string instead of
// one per item, which also fixes that same category consistently across
// every item that uses it.
export function addMenuTranslationFields(items: MenuItemInput[], translationFields: Record<string, string>) {
  const categoryKeys = new Map<string, string>();
  const variantKeys = new Map<string, string>();
  const keyFor = (map: Map<string, string>, prefix: string, text: string) => {
    let key = map.get(text);
    if (!key) {
      key = `${prefix}_${map.size}`;
      map.set(text, key);
    }
    return key;
  };
  items.forEach((it, i) => {
    translationFields[`menuName_${i}`] = it.name;
    if (it.description) translationFields[`menuDescription_${i}`] = it.description;
    if (it.category) translationFields[keyFor(categoryKeys, "menuCategory", it.category)] = it.category;
    (it.variants ?? []).forEach((v) => {
      translationFields[keyFor(variantKeys, "menuVariant", v.label)] = v.label;
    });
  });

  // With no translations yet, this is the French-only menu for the immediate save.
  return (translations: Record<string, Record<string, string>> = {}): DigitalMenuItem[] =>
    items.map((it, i) => ({
      name: { fr: it.name, ...translations[`menuName_${i}`] },
      description: it.description ? { fr: it.description, ...translations[`menuDescription_${i}`] } : null,
      price: it.price,
      category: it.category ? { fr: it.category, ...translations[categoryKeys.get(it.category)!] } : null,
      variants:
        it.variants && it.variants.length > 0
          ? it.variants.map((v) => ({ label: { fr: v.label, ...translations[variantKeys.get(v.label)!] }, price: v.price }))
          : null,
      photo: it.photo ?? null,
    }));
}
