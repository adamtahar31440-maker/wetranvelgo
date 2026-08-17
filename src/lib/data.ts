import { getDb } from "@/db";
import {
  categories,
  cities,
  establishments,
  contentPages,
  emergencyContacts,
  siteSections,
  subcategories,
} from "@/db/schema";
import { desc, eq, and, asc } from "drizzle-orm";
import { cache } from "react";

// Cached per-request: layout, page and generateMetadata for a given [ville]
// segment all need to resolve the same city, this dedupes those into one query.
export const getCityBySlug = cache(async (slug: string) => {
  const db = getDb();
  const rows = await db.select().from(cities).where(eq(cities.slug, slug));
  return rows[0] ?? null;
});

export async function getActiveCities() {
  const db = getDb();
  return db.select().from(cities).where(eq(cities.status, "active")).orderBy(asc(cities.slug));
}

export async function getCategories() {
  const db = getDb();
  return db.select().from(categories).orderBy(asc(categories.order));
}

export async function getCategoryByType(type: string) {
  const db = getDb();
  const rows = await db.select().from(categories).where(eq(categories.type, type));
  return rows[0] ?? null;
}

export async function getCategoryBySlug(slug: string) {
  const db = getDb();
  const rows = await db.select().from(categories).where(eq(categories.slug, slug));
  return rows[0] ?? null;
}

export async function getSubcategories(categoryId: number) {
  const db = getDb();
  return db
    .select()
    .from(subcategories)
    .where(eq(subcategories.categoryId, categoryId))
    .orderBy(asc(subcategories.order), asc(subcategories.id));
}

export async function getAllSubcategories() {
  const db = getDb();
  return db.select().from(subcategories);
}

export async function getEstablishments(opts: {
  cityId?: number;
  type?: string;
  subcategory?: string;
  featured?: boolean;
  limit?: number;
} = {}) {
  const db = getDb();
  const conditions = [];

  if (opts.cityId) {
    conditions.push(eq(establishments.cityId, opts.cityId));
  }
  if (opts.type) {
    const cat = await getCategoryByType(opts.type);
    if (!cat) return [];
    conditions.push(eq(establishments.categoryId, cat.id));
  }
  if (opts.subcategory) {
    conditions.push(eq(establishments.subcategory, opts.subcategory));
  }
  if (opts.featured) {
    conditions.push(eq(establishments.featured, true));
  }

  conditions.push(eq(establishments.status, "active"));

  const query = db
    .select()
    .from(establishments)
    .where(and(...conditions))
    .orderBy(desc(establishments.featured), desc(establishments.createdAt));

  if (opts.limit) return query.limit(opts.limit);
  return query;
}

// cityId narrows the lookup to one city's fiche when known (public site pages,
// where slugs are only unique per city). Left out for the standalone QR/menu
// routes, which look establishments up by slug alone across every city.
export async function getEstablishmentBySlug(slug: string, cityId?: number) {
  const db = getDb();
  const conditions = [eq(establishments.slug, slug), eq(establishments.status, "active")];
  if (cityId) conditions.push(eq(establishments.cityId, cityId));
  const rows = await db
    .select()
    .from(establishments)
    .where(and(...conditions));
  return rows[0] ?? null;
}

export async function getSimilarEstablishments(categoryId: number, cityId: number, excludeSlug: string, limit = 3) {
  const db = getDb();
  const rows = await db
    .select()
    .from(establishments)
    .where(and(eq(establishments.categoryId, categoryId), eq(establishments.cityId, cityId), eq(establishments.status, "active")))
    .limit(limit + 1);
  return rows.filter((r) => r.slug !== excludeSlug).slice(0, limit);
}

// No cityId filter — used by the sitemap, which needs every city's fiches at once.
export async function getAllEstablishments() {
  const db = getDb();
  return db
    .select()
    .from(establishments)
    .where(eq(establishments.status, "active"))
    .orderBy(desc(establishments.createdAt));
}

export async function getContentPages(section: string, cityId: number) {
  const db = getDb();
  return db
    .select()
    .from(contentPages)
    .where(and(eq(contentPages.section, section), eq(contentPages.cityId, cityId)))
    .orderBy(asc(contentPages.order));
}

export async function getSiteSections() {
  const db = getDb();
  return db.select().from(siteSections).orderBy(asc(siteSections.order));
}

export async function getSiteSectionBySlug(slug: string) {
  const db = getDb();
  const rows = await db.select().from(siteSections).where(eq(siteSections.slug, slug));
  return rows[0] ?? null;
}

export async function getContentPageBySlug(section: string, slug: string, cityId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(contentPages)
    .where(and(eq(contentPages.section, section), eq(contentPages.slug, slug), eq(contentPages.cityId, cityId)));
  return rows[0] ?? null;
}

export async function getEmergencyContacts(cityId: number, category?: string) {
  const db = getDb();
  const conditions = [eq(emergencyContacts.cityId, cityId)];
  if (category) conditions.push(eq(emergencyContacts.category, category));
  return db
    .select()
    .from(emergencyContacts)
    .where(and(...conditions))
    .orderBy(asc(emergencyContacts.order));
}

export async function getFeaturedEmergencyContacts(cityId: number) {
  const db = getDb();
  return db
    .select()
    .from(emergencyContacts)
    .where(and(eq(emergencyContacts.cityId, cityId), eq(emergencyContacts.featured, true)))
    .orderBy(asc(emergencyContacts.order));
}
