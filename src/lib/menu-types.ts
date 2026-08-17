// Duplicated from db/schema's Localized rather than imported, so this file
// (used by client components) never pulls in schema.ts's drizzle-orm imports.
export type Localized = Record<string, string>;

// A restaurant's digital menu item. Unlike the generic `products` price list
// (name/price/category), menu items can carry a description and multiple
// priced variants (e.g. a glass vs. a bottle of wine) — both optional since
// most dishes are a single name + single price.
export type MenuItemVariant = { label: Localized; price: number };

export type DigitalMenuItem = {
  name: Localized;
  description: Localized | null;
  price: number | null;
  category: Localized | null;
  variants: MenuItemVariant[] | null;
  // A single photo URL, same across every locale (not translated). Optional —
  // the public menu falls back to a generic dish/drink placeholder when unset.
  photo: string | null;
};
