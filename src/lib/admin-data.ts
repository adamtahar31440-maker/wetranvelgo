import { getDb } from "@/db";
import {
  cities,
  establishments,
  categories,
  contentPages,
  professionals,
  subscriptionPlans,
  subscriptions,
  invoices,
  adCampaigns,
  reviews,
  favorites,
  serviceOrders,
  modules,
  siteSettings,
  newsletterSubscribers,
  emergencyContacts,
  labelEvaluations,
  labelBadges,
  labelApplications,
  siteSections,
  subcategories,
  menuScans,
} from "@/db/schema";
import { desc, eq, count, asc, and, isNull } from "drizzle-orm";

// ---- Dashboard stats ----
export async function getDashboardStats() {
  const db = getDb();
  const [
    establishmentsCount,
    professionalsCount,
    reviewsPending,
    subscriptionsActive,
    newsletterCount,
    menuScansTotal,
  ] = await Promise.all([
    db.select({ c: count() }).from(establishments),
    db.select({ c: count() }).from(professionals),
    db.select({ c: count() }).from(reviews).where(eq(reviews.status, "pending")),
    db.select({ c: count() }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db.select({ c: count() }).from(newsletterSubscribers),
    db.select({ c: count() }).from(menuScans),
  ]);

  return {
    establishments: establishmentsCount[0]?.c ?? 0,
    professionals: professionalsCount[0]?.c ?? 0,
    reviewsPending: reviewsPending[0]?.c ?? 0,
    activeSubscriptions: subscriptionsActive[0]?.c ?? 0,
    newsletterSubscribers: newsletterCount[0]?.c ?? 0,
    menuScans: menuScansTotal[0]?.c ?? 0,
  };
}

// ---- Establishments (admin: all statuses) ----
export async function adminGetEstablishments() {
  const db = getDb();
  return db.select().from(establishments).orderBy(desc(establishments.createdAt));
}

export async function adminGetEstablishmentById(id: number) {
  const db = getDb();
  const rows = await db.select().from(establishments).where(eq(establishments.id, id));
  return rows[0] ?? null;
}

// ---- Label evaluations ("Essaouira Inside Approved") ----
export async function adminGetLabelEvaluations(establishmentId: number) {
  const db = getDb();
  return db
    .select()
    .from(labelEvaluations)
    .where(eq(labelEvaluations.establishmentId, establishmentId))
    .orderBy(desc(labelEvaluations.createdAt));
}

export async function getLabelEvaluationById(id: number) {
  const db = getDb();
  const rows = await db.select().from(labelEvaluations).where(eq(labelEvaluations.id, id));
  return rows[0] ?? null;
}

// Public multi-year badge history, e.g. "Approved 2026 ✓, 2027 ✓"
export async function getLabelBadges(establishmentId: number) {
  const db = getDb();
  return db
    .select()
    .from(labelBadges)
    .where(eq(labelBadges.establishmentId, establishmentId))
    .orderBy(labelBadges.year);
}

export async function adminGetLabelApplications() {
  const db = getDb();
  return db.select().from(labelApplications).orderBy(desc(labelApplications.createdAt));
}

export async function adminGetLabelApplicationById(id: number) {
  const db = getDb();
  const rows = await db.select().from(labelApplications).where(eq(labelApplications.id, id));
  return rows[0] ?? null;
}

export async function getLabelApplicationByEstablishmentId(establishmentId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(labelApplications)
    .where(eq(labelApplications.establishmentId, establishmentId))
    .orderBy(desc(labelApplications.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export { categories };

export async function getAllCategories() {
  const db = getDb();
  return db.select().from(categories);
}

// ---- Categories & subcategories (admin-manageable) ----
export async function adminGetCategories() {
  const db = getDb();
  return db.select().from(categories).orderBy(asc(categories.order), asc(categories.id));
}

export async function adminGetCities() {
  const db = getDb();
  return db.select().from(cities).orderBy(asc(cities.slug));
}

export async function adminGetCityById(id: number) {
  const db = getDb();
  const rows = await db.select().from(cities).where(eq(cities.id, id));
  return rows[0] ?? null;
}

export async function adminCountEstablishmentsByCity(cityId: number) {
  const db = getDb();
  const rows = await db.select({ value: count() }).from(establishments).where(eq(establishments.cityId, cityId));
  return rows[0]?.value ?? 0;
}

export async function adminGetCategoryById(id: number) {
  const db = getDb();
  const rows = await db.select().from(categories).where(eq(categories.id, id));
  return rows[0] ?? null;
}

export async function adminGetSubcategories(categoryId: number) {
  const db = getDb();
  return db
    .select()
    .from(subcategories)
    .where(eq(subcategories.categoryId, categoryId))
    .orderBy(asc(subcategories.order), asc(subcategories.id));
}

export async function adminCountEstablishmentsByCategory(categoryId: number) {
  const db = getDb();
  const rows = await db.select({ value: count() }).from(establishments).where(eq(establishments.categoryId, categoryId));
  return rows[0]?.value ?? 0;
}

export async function adminCountEstablishmentsBySubcategory(categoryId: number, subcategorySlug: string) {
  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(establishments)
    .where(and(eq(establishments.categoryId, categoryId), eq(establishments.subcategory, subcategorySlug)));
  return rows[0]?.value ?? 0;
}

// ---- Content pages ----
export async function adminGetContentPages() {
  const db = getDb();
  return db.select().from(contentPages).orderBy(asc(contentPages.section), asc(contentPages.order), desc(contentPages.id));
}

export async function adminGetContentPageById(id: number) {
  const db = getDb();
  const rows = await db.select().from(contentPages).where(eq(contentPages.id, id));
  return rows[0] ?? null;
}

// ---- Site sections (custom nav sections for content pages) ----
export async function adminGetSiteSections() {
  const db = getDb();
  return db.select().from(siteSections).orderBy(asc(siteSections.order), desc(siteSections.id));
}

export async function adminGetSiteSectionById(id: number) {
  const db = getDb();
  const rows = await db.select().from(siteSections).where(eq(siteSections.id, id));
  return rows[0] ?? null;
}

export async function adminCountContentPagesBySection(section: string) {
  const db = getDb();
  const rows = await db.select({ value: count() }).from(contentPages).where(eq(contentPages.section, section));
  return rows[0]?.value ?? 0;
}

// ---- Professionals ----
export async function adminGetProfessionals() {
  const db = getDb();
  return db.select().from(professionals).orderBy(desc(professionals.createdAt));
}

export async function adminGetProfessionalById(id: number) {
  const db = getDb();
  const rows = await db.select().from(professionals).where(eq(professionals.id, id));
  return rows[0] ?? null;
}

export async function getProfessionalByClerkId(clerkUserId: string) {
  const db = getDb();
  const rows = await db.select().from(professionals).where(eq(professionals.clerkUserId, clerkUserId));
  return rows[0] ?? null;
}

// ---- Subscriptions & plans ----
export async function getSubscriptionPlans() {
  const db = getDb();
  return db.select().from(subscriptionPlans).orderBy(subscriptionPlans.order);
}

export async function adminGetSubscriptions() {
  const db = getDb();
  return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
}

export async function getSubscriptionByProfessionalId(professionalId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.professionalId, professionalId))
    .orderBy(desc(subscriptions.createdAt));
  return rows[0] ?? null;
}

// ---- Invoices ----
export async function adminGetInvoices() {
  const db = getDb();
  return db.select().from(invoices).orderBy(desc(invoices.issuedAt));
}

export async function getInvoicesByProfessionalId(professionalId: number) {
  const db = getDb();
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.professionalId, professionalId))
    .orderBy(desc(invoices.issuedAt));
}

// ---- Ads ----
export async function adminGetAdCampaigns() {
  const db = getDb();
  return db.select().from(adCampaigns).orderBy(desc(adCampaigns.startDate));
}

// ---- Reviews ----
export async function adminGetReviews() {
  const db = getDb();
  return db.select().from(reviews).orderBy(desc(reviews.createdAt));
}

export async function getApprovedReviewsForEstablishment(establishmentId: number) {
  const db = getDb();
  const rows = await db.select().from(reviews).where(eq(reviews.establishmentId, establishmentId));
  return rows.filter((r) => r.status === "approved");
}

// ---- Favorites ----
export async function getFavoritesByUser(clerkUserId: string) {
  const db = getDb();
  return db.select().from(favorites).where(eq(favorites.clerkUserId, clerkUserId));
}

// ---- Service orders (marketplace) ----
export async function adminGetServiceOrders() {
  const db = getDb();
  return db.select().from(serviceOrders).orderBy(desc(serviceOrders.createdAt));
}

export async function getServiceOrdersByProfessionalId(professionalId: number) {
  const db = getDb();
  return db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.professionalId, professionalId))
    .orderBy(desc(serviceOrders.createdAt));
}

// ---- Modules ----
export async function getModules() {
  const db = getDb();
  return db.select().from(modules).orderBy(modules.key);
}

// ---- Newsletter ----
export async function adminGetNewsletterSubscribers() {
  const db = getDb();
  return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
}

// ---- Site settings ----
// cityId null = the global wetravelgo.com landing page's branding row.
export async function getSiteSettings(cityId: number | null) {
  const db = getDb();
  const rows = await db
    .select()
    .from(siteSettings)
    .where(cityId === null ? isNull(siteSettings.cityId) : eq(siteSettings.cityId, cityId))
    .limit(1);
  return rows[0] ?? null;
}

// ---- Emergency contacts (Assistance) ----
export async function adminGetEmergencyContacts() {
  const db = getDb();
  return db.select().from(emergencyContacts).orderBy(emergencyContacts.category, emergencyContacts.order);
}

export async function adminGetEmergencyContactById(id: number) {
  const db = getDb();
  const rows = await db.select().from(emergencyContacts).where(eq(emergencyContacts.id, id));
  return rows[0] ?? null;
}
