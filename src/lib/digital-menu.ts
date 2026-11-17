import { MENU_SECTION_KINDS, type DigitalMenuItem, type MenuSection, type MenuSectionKind } from "@/lib/menu-types";

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
// `prefix` keeps several menus (a hotel's rooms, restaurant, spa) apart when
// they share one translation request.
export function addMenuTranslationFields(
  items: MenuItemInput[],
  translationFields: Record<string, string>,
  prefix = "menu",
  sourceLocale = "fr"
) {
  const categoryKeys = new Map<string, string>();
  const variantKeys = new Map<string, string>();
  const keyFor = (map: Map<string, string>, keyPrefix: string, text: string) => {
    let key = map.get(text);
    if (!key) {
      key = `${keyPrefix}_${map.size}`;
      map.set(text, key);
    }
    return key;
  };
  items.forEach((it, i) => {
    translationFields[`${prefix}Name_${i}`] = it.name;
    if (it.description) translationFields[`${prefix}Description_${i}`] = it.description;
    if (it.category) translationFields[keyFor(categoryKeys, `${prefix}Category`, it.category)] = it.category;
    (it.variants ?? []).forEach((v) => {
      translationFields[keyFor(variantKeys, `${prefix}Variant`, v.label)] = v.label;
    });
  });

  // With no translations yet, this is the French-only menu for the immediate save.
  return (translations: Record<string, Record<string, string>> = {}): DigitalMenuItem[] =>
    items.map((it, i) => ({
      name: { [sourceLocale]: it.name, ...translations[`${prefix}Name_${i}`] },
      description: it.description ? { [sourceLocale]: it.description, ...translations[`${prefix}Description_${i}`] } : null,
      price: it.price,
      category: it.category ? { [sourceLocale]: it.category, ...translations[categoryKeys.get(it.category)!] } : null,
      variants:
        it.variants && it.variants.length > 0
          ? it.variants.map((v) => ({ label: { [sourceLocale]: v.label, ...translations[variantKeys.get(v.label)!] }, price: v.price }))
          : null,
      photo: it.photo ?? null,
    }));
}

// ---- Extra QR sections (a hotel's restaurant, spa...) ----

export type MenuSectionInput = { kind: MenuSectionKind; items: MenuItemInput[] };

// Each section's editor posts "menuSection_<kind>"; "menuSectionsPresent"
// tells a form that offers sections (and may have removed them all) apart
// from one that doesn't show them at all — null means "leave as stored".
export function parseMenuSections(formData: FormData): MenuSectionInput[] | null {
  if (!formData.has("menuSectionsPresent")) return null;
  return MENU_SECTION_KINDS.flatMap((kind) =>
    formData.has(`menuSection_${kind}`) ? [{ kind, items: parseMenuItems(formData.get(`menuSection_${kind}`)) }] : []
  );
}

export function storedSectionsToInput(sections: MenuSection[] | null | undefined): MenuSectionInput[] {
  return (sections ?? []).map((s) => ({ kind: s.kind, items: storedMenuToInput(s.items) }));
}

export function areSectionsUnchanged(input: MenuSectionInput[], stored: MenuSection[] | null | undefined) {
  return JSON.stringify(input) === JSON.stringify(storedSectionsToInput(stored));
}

export function addMenuSectionsTranslationFields(
  sections: MenuSectionInput[],
  translationFields: Record<string, string>,
  sourceLocale = "fr"
) {
  const builders = sections.map((s) => ({
    kind: s.kind,
    build: addMenuTranslationFields(s.items, translationFields, `${s.kind}Menu`, sourceLocale),
  }));
  return (translations: Record<string, Record<string, string>> = {}): MenuSection[] =>
    builders.map((b) => ({ kind: b.kind, items: b.build(translations) }));
}

// Whether the QR page has anything to show (the main catalog or any section).
export function hasDigitalCatalog(e: { digitalMenu?: DigitalMenuItem[] | null; menuSections?: MenuSection[] | null }) {
  return (e.digitalMenu?.length ?? 0) > 0 || (e.menuSections ?? []).some((s) => s.items.length > 0);
}
