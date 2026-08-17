import { getDb } from "@/db";
import { modules, categories, siteSections, contentPages } from "@/db/schema";
import { inArray, asc } from "drizzle-orm";

// Builtin pages the admin can rename, reorder and hide from the flat nav via
// /admin/nav — but never delete, since that would take down the feature
// behind them. Tarifs and Assistance are deliberately excluded: they stay
// exactly as hardcoded, unmanaged links (explicit request from the site owner).
export const BUILTIN_NAV_DEFAULTS: Record<string, { href: string; i18nKey: string }> = {};

export type NavItem = {
  type: "builtin" | "category" | "section";
  id: number;
  key: string;
  href: string;
  label: Record<string, string> | null;
  i18nKey?: string;
  order: number;
  active: boolean;
  deletable: boolean;
  pages?: { slug: string; label: Record<string, string> }[];
};

export async function getNavItems(): Promise<NavItem[]> {
  const db = getDb();
  const builtinKeys = Object.keys(BUILTIN_NAV_DEFAULTS);
  const [moduleRows, categoryRows, sectionRows] = await Promise.all([
    db.select().from(modules).where(inArray(modules.key, builtinKeys)),
    db.select().from(categories),
    db.select().from(siteSections),
  ]);

  const items: NavItem[] = [];
  for (const m of moduleRows) {
    const def = BUILTIN_NAV_DEFAULTS[m.key];
    if (!def) continue;
    items.push({
      type: "builtin",
      id: m.id,
      key: m.key,
      href: def.href,
      label: m.label,
      i18nKey: def.i18nKey,
      order: m.order ?? 0,
      active: m.status === "active",
      deletable: false,
    });
  }
  for (const c of categoryRows) {
    items.push({
      type: "category",
      id: c.id,
      key: c.slug,
      href: `/${c.slug}`,
      label: c.name,
      order: c.order ?? 0,
      active: c.status === "active",
      deletable: true,
    });
  }
  const sectionSlugs = sectionRows.map((s) => s.slug);
  const pageRows =
    sectionSlugs.length > 0
      ? await db
          .select()
          .from(contentPages)
          .where(inArray(contentPages.section, sectionSlugs))
          .orderBy(asc(contentPages.order))
      : [];

  for (const s of sectionRows) {
    items.push({
      type: "section",
      id: s.id,
      key: s.slug,
      href: `/${s.slug}`,
      label: s.name,
      order: s.order ?? 0,
      active: true,
      deletable: true,
      pages: pageRows.filter((p) => p.section === s.slug).map((p) => ({ slug: p.slug, label: p.title })),
    });
  }

  return items.sort((a, b) => a.order - b.order);
}
