"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { waitUntil } from "@vercel/functions";
import { eq, desc, and, asc, ne, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  cities,
  establishments,
  contentPages,
  categories,
  subcategories,
  professionals,
  subscriptions,
  invoices,
  serviceOrders,
  reviews,
  favorites,
  modules,
  siteSettings,
  adCampaigns,
  newsletterSubscribers,
  emergencyContacts,
  labelEvaluations,
  labelBadges,
  labelApplications,
  siteSections,
} from "@/db/schema";
import { can, type Role } from "@/lib/roles";
import { LABEL_CRITERIA } from "@/lib/label-criteria";
import { slugify } from "@/lib/slug";
import { readLocalized, ALL_LOCALES } from "@/lib/localized-form";
import { translateFields } from "@/lib/translate";
import { sanitizeBody } from "@/lib/sanitize-body";
import { qrFeatureLabel } from "@/lib/qr-feature-label";
import { RESERVED_TOP_LEVEL_SLUGS } from "@/lib/categories";
import { adminCountEstablishmentsByCategory, adminCountEstablishmentsBySubcategory } from "@/lib/admin-data";
import { getNavItems } from "@/lib/nav";
import { sendActivationEmail } from "@/lib/email";

async function requireRole(section: Parameters<typeof can>[1]) {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as Role | undefined;
  if (!can(role, section)) {
    throw new Error("Forbidden");
  }
  return { user, role };
}

// ---- Establishments ----
export async function toggleEstablishmentFeatured(id: number, featured: boolean) {
  await requireRole("establishments");
  const db = getDb();
  await db.update(establishments).set({ featured }).where(eq(establishments.id, id));
  revalidatePath("/", "layout");
}

export async function setEstablishmentStatus(id: number, status: "active" | "disabled") {
  await requireRole("establishments");
  const db = getDb();
  await db.update(establishments).set({ status }).where(eq(establishments.id, id));
  revalidatePath("/", "layout");
}

export async function setEstablishmentBadge(id: number, badge: string | null) {
  await requireRole("establishments");
  const db = getDb();
  await db.update(establishments).set({ badge }).where(eq(establishments.id, id));
  revalidatePath("/", "layout");
}

// Manual paid-addon gate: Moroccan restaurateurs mostly pay by bank transfer
// or cash, not card, so there's no Stripe checkout for this feature — the
// admin flips this on once payment is confirmed off-platform.
export async function setMenuTranslationEnabled(id: number, enabled: boolean) {
  await requireRole("establishments");
  const db = getDb();
  await db.update(establishments).set({ menuTranslationEnabled: enabled }).where(eq(establishments.id, id));
  revalidatePath("/", "layout");
}

export async function deleteEstablishment(id: number) {
  await requireRole("establishments");
  const db = getDb();
  await db.delete(establishments).where(eq(establishments.id, id));
  revalidatePath("/", "layout");
}


export async function upsertEstablishment(formData: FormData) {
  await requireRole("establishments");
  const db = getDb();

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const hours = String(formData.get("hours") ?? "");

  let productsInput: { name: string; price: number | null; category: string | null }[] = [];
  try {
    productsInput = JSON.parse(String(formData.get("products") ?? "[]"));
  } catch {
    productsInput = [];
  }

  const activitiesInput = String(formData.get("otherActivities") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const vacationStart = String(formData.get("vacationStart") ?? "") || null;
  const vacationEnd = String(formData.get("vacationEnd") ?? "") || null;

  // Translating into all locales is an LLM call that can take several seconds; running it
  // before the insert/update made "Enregistrer" feel frozen. Save in French immediately and
  // fill in the other locales afterwards via waitUntil, once the redirect has been sent.
  const localizedName = { fr: name };
  const localizedDescription = { fr: description };
  const localizedHours = hours ? { fr: hours } : null;
  const products = productsInput.map((p) => ({
    name: { fr: p.name },
    price: p.price,
    category: p.category ? { fr: p.category } : null,
  }));
  const services = activitiesInput.length > 0 ? { fr: activitiesInput } : null;

  const data = {
    cityId: Number(formData.get("cityId")),
    categoryId: Number(formData.get("categoryId")),
    subcategory: String(formData.get("subcategory") ?? ""),
    subcategories: formData.getAll("subcategories").map(String).filter(Boolean),
    avgDailyPriceMad: formData.get("avgDailyPriceMad") ? Number(formData.get("avgDailyPriceMad")) : null,
    slug: id ? String(formData.get("slug")) : slugify(name),
    name: localizedName,
    description: localizedDescription,
    hours: localizedHours,
    vacationStart,
    vacationEnd,
    address: String(formData.get("address") ?? ""),
    lat: formData.get("lat") ? Number(formData.get("lat")) : null,
    lng: formData.get("lng") ? Number(formData.get("lng")) : null,
    phone: String(formData.get("phone") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    website: String(formData.get("website") ?? ""),
    instagram: String(formData.get("instagram") ?? "") || null,
    facebook: String(formData.get("facebook") ?? "") || null,
    googleReviewsUrl: String(formData.get("googleReviewsUrl") ?? "") || null,
    tripadvisorUrl: String(formData.get("tripadvisorUrl") ?? "") || null,
    priceLevel: String(formData.get("priceLevel") ?? ""),
    products,
    services,
    parking: formData.get("parking") === "on",
    wifi: formData.get("wifi") === "on",
    accessibility: formData.get("accessibility") === "on",
    pool: formData.get("pool") === "on",
    airConditioning: formData.get("airConditioning") === "on",
    petsAllowed: formData.get("petsAllowed") === "on",
    featured: formData.get("featured") === "on",
    badge: String(formData.get("badge") ?? "") || null,
    professionalId: formData.get("professionalId") ? Number(formData.get("professionalId")) : null,
    status: (formData.get("status") as "active" | "disabled") ?? "active",
    images: String(formData.get("images") ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  };

  let establishmentId = id;
  if (id) {
    await db.update(establishments).set(data).where(eq(establishments.id, id));
  } else {
    // Every business gets the digital catalog/QR feature on immediately when
    // created — set only here, on insert, so re-saving an existing fiche from
    // admin never fights whatever the admin has manually toggled since.
    const [inserted] = await db
      .insert(establishments)
      .values({ ...data, menuTranslationEnabled: true })
      .returning();
    establishmentId = inserted.id;
  }

  const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
  const translationFields: Record<string, string> = { name, description };
  if (hours) translationFields.hours = hours;
  productsInput.forEach((p, i) => {
    translationFields[`product_${i}`] = p.name;
    if (p.category) translationFields[`category_${i}`] = p.category;
  });
  activitiesInput.forEach((a, i) => {
    translationFields[`activity_${i}`] = a;
  });

  waitUntil(
    translateFields(translationFields, targetLocales, "fr")
      .then(async (translations) => {
        if (Object.keys(translations).length === 0 || !establishmentId) return;

        const update: Partial<typeof establishments.$inferInsert> = {
          name: { ...localizedName, ...translations.name },
          description: { ...localizedDescription, ...translations.description },
        };

        if (localizedHours) {
          update.hours = { ...localizedHours, ...translations.hours };
        }

        if (products.length > 0) {
          update.products = productsInput.map((p, i) => ({
            name: { fr: p.name, ...translations[`product_${i}`] },
            price: p.price,
            category: p.category ? { fr: p.category, ...translations[`category_${i}`] } : null,
          }));
        }

        if (services) {
          const servicesByLocale: Record<string, string[]> = { fr: activitiesInput };
          for (const locale of targetLocales) {
            servicesByLocale[locale] = activitiesInput.map((text, i) => translations[`activity_${i}`]?.[locale] ?? text);
          }
          update.services = servicesByLocale;
        }

        await db.update(establishments).set(update).where(eq(establishments.id, establishmentId));
      })
      .catch((err) => console.error("Background translation failed for establishment", establishmentId, err))
  );

  revalidatePath("/", "layout");
  redirect(`/${formData.get("locale")}/admin/establissements`);
}


// ---- Content pages ----
export async function deleteContentPage(id: number) {
  await requireRole("articles");
  const db = getDb();
  await db.delete(contentPages).where(eq(contentPages.id, id));
  revalidatePath("/", "layout");
}

export async function moveContentPage(id: number, direction: "up" | "down") {
  await requireRole("articles");
  const db = getDb();
  const [page] = await db.select().from(contentPages).where(eq(contentPages.id, id));
  if (!page) return;

  const siblings = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.section, page.section))
    .orderBy(asc(contentPages.order), desc(contentPages.id));
  const index = siblings.findIndex((p) => p.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return;

  const current = siblings[index];
  const swap = siblings[swapIndex];
  await db.update(contentPages).set({ order: swap.order }).where(eq(contentPages.id, current.id));
  await db.update(contentPages).set({ order: current.order }).where(eq(contentPages.id, swap.id));
  revalidatePath("/", "layout");
}

export async function upsertContentPage(formData: FormData) {
  await requireRole("articles");
  const db = getDb();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");

  let pricesInput: { name: string; price: number | null; category: string | null }[] = [];
  try {
    pricesInput = JSON.parse(String(formData.get("prices") ?? "[]"));
  } catch {
    pricesInput = [];
  }

  let clientTranslations: Record<string, Record<string, string>> = {};
  try {
    clientTranslations = JSON.parse(String(formData.get("translations") ?? "{}"));
  } catch {
    clientTranslations = {};
  }

  const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
  const translationFields: Record<string, string> = { title, body };
  pricesInput.forEach((p, i) => {
    translationFields[`price_${i}`] = p.name;
    if (p.category) translationFields[`priceCategory_${i}`] = p.category;
  });

  // The form already translates language by language client-side (for a real
  // progress indicator) before submitting. Only fall back to a server-side batch
  // translation for locales the client didn't supply (JS disabled, a request failed).
  const missingLocales = targetLocales.filter((l) => !clientTranslations[l]);
  const serverTranslations =
    missingLocales.length > 0 ? await translateFields(translationFields, missingLocales, "fr") : {};

  const translations: Record<string, Record<string, string>> = {};
  for (const field of Object.keys(translationFields)) {
    translations[field] = {};
    for (const l of targetLocales) {
      const value = clientTranslations[l]?.[field] || serverTranslations[field]?.[l];
      if (value) translations[field][l] = value;
    }
  }

  const prices = pricesInput.map((p, i) => ({
    name: { fr: p.name, ...translations[`price_${i}`] },
    price: p.price,
    category: p.category ? { fr: p.category, ...translations[`priceCategory_${i}`] } : null,
  }));

  let mapPoints: { label: string; lat: number; lng: number }[] = [];
  try {
    mapPoints = JSON.parse(String(formData.get("mapPoints") ?? "[]"));
  } catch {
    mapPoints = [];
  }

  // The body is rich HTML from the article editor — the fr source is sanitized (a
  // trusted admin still can't hand-inject a stray <script> through devtools) and
  // every AI-translated locale is sanitized too, since a translation pass could in
  // theory hallucinate a tag outside what the editor's toolbar can actually produce.
  const sanitizedBodyTranslations = Object.fromEntries(
    Object.entries(translations.body ?? {}).map(([l, v]) => [l, sanitizeBody(v)])
  );

  const section = String(formData.get("section") ?? "assistance-guides");
  const cityId = Number(formData.get("cityId"));
  const data = {
    cityId,
    section,
    slug: id ? String(formData.get("slug")) : slugify(title),
    title: { fr: title, ...translations.title },
    body: { fr: sanitizeBody(body), ...sanitizedBodyTranslations },
    coverImage: String(formData.get("coverImage") ?? "") || null,
    prices,
    mapEnabled: formData.get("mapEnabled") === "on",
    mapPoints,
  };

  if (id) {
    await db.update(contentPages).set(data).where(eq(contentPages.id, id));
  } else {
    const existingInSection = await db
      .select({ order: contentPages.order })
      .from(contentPages)
      .where(and(eq(contentPages.section, section), eq(contentPages.cityId, cityId)));
    const nextOrder = existingInSection.reduce((max, p) => Math.max(max, p.order ?? 0), 0) + 10;
    await db.insert(contentPages).values({ ...data, order: nextOrder });
  }
  revalidatePath("/", "layout");
}

// ---- Site sections ----
export async function upsertSiteSection(formData: FormData) {
  await requireRole("articles");
  const db = getDb();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const name = String(formData.get("name") ?? "");
  const requestedSlug = slugify(String(formData.get("slug") ?? "") || name);

  if (RESERVED_TOP_LEVEL_SLUGS.includes(requestedSlug)) {
    throw new Error(
      `"${requestedSlug}" est déjà utilisé par une page du site et ne peut pas servir de section. Choisissez un autre nom.`
    );
  }
  const slugTakenByCategory = await db.select().from(categories).where(eq(categories.slug, requestedSlug));
  if (slugTakenByCategory.length > 0) {
    throw new Error(`"${requestedSlug}" est déjà utilisé par une catégorie. Choisissez un autre nom.`);
  }

  let clientTranslations: Record<string, Record<string, string>> = {};
  try {
    clientTranslations = JSON.parse(String(formData.get("translations") ?? "{}"));
  } catch {
    clientTranslations = {};
  }

  const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
  const missingLocales = targetLocales.filter((l) => !clientTranslations[l]);
  const serverTranslations =
    missingLocales.length > 0 ? await translateFields({ name }, missingLocales, "fr") : {};

  const nameTranslations: Record<string, string> = {};
  for (const l of targetLocales) {
    const value = clientTranslations[l]?.name || serverTranslations.name?.[l];
    if (value) nameTranslations[l] = value;
  }

  const data = {
    slug: requestedSlug,
    name: { fr: name, ...nameTranslations },
  };

  if (id) {
    await db.update(siteSections).set(data).where(eq(siteSections.id, id));
  } else {
    const existing = await db.select({ order: siteSections.order }).from(siteSections);
    const nextOrder = existing.reduce((max, s) => Math.max(max, s.order ?? 0), 0) + 10;
    await db.insert(siteSections).values({ ...data, order: nextOrder });
  }
  revalidatePath("/", "layout");
}

export async function deleteSiteSection(id: number) {
  await requireRole("articles");
  const db = getDb();
  await db.delete(siteSections).where(eq(siteSections.id, id));
  revalidatePath("/", "layout");
}

export async function moveSiteSection(id: number, direction: "up" | "down") {
  await requireRole("articles");
  const db = getDb();
  const all = await db.select().from(siteSections).orderBy(asc(siteSections.order), desc(siteSections.id));
  const index = all.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swap = all[swapIndex];
  await db.update(siteSections).set({ order: swap.order }).where(eq(siteSections.id, current.id));
  await db.update(siteSections).set({ order: current.order }).where(eq(siteSections.id, swap.id));
  revalidatePath("/", "layout");
}

// ---- Categories ----
export async function upsertCategory(formData: FormData) {
  await requireRole("categories");
  const db = getDb();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const name = String(formData.get("name") ?? "");
  const icon = String(formData.get("icon") ?? "") || null;
  const requestedSlug = slugify(String(formData.get("slug") ?? "") || name);

  if (RESERVED_TOP_LEVEL_SLUGS.includes(requestedSlug)) {
    throw new Error(
      `"${requestedSlug}" est déjà utilisé par une page du site et ne peut pas servir de catégorie. Choisissez un autre nom.`
    );
  }
  const slugTakenByCategory = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, requestedSlug), id ? ne(categories.id, id) : undefined));
  const slugTakenBySection = await db.select().from(siteSections).where(eq(siteSections.slug, requestedSlug));
  if (slugTakenByCategory.length > 0 || slugTakenBySection.length > 0) {
    throw new Error(`"${requestedSlug}" est déjà utilisé ailleurs sur le site. Choisissez un autre nom.`);
  }

  const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
  const translations = await translateFields({ name }, targetLocales, "fr");
  const localizedName = { fr: name, ...translations.name };

  if (id) {
    await db.update(categories).set({ name: localizedName, icon, slug: requestedSlug }).where(eq(categories.id, id));
  } else {
    const existing = await db.select({ order: categories.order }).from(categories);
    const nextOrder = existing.reduce((max, c) => Math.max(max, c.order ?? 0), 0) + 10;
    await db.insert(categories).values({
      type: requestedSlug,
      slug: requestedSlug,
      name: localizedName,
      icon,
      order: nextOrder,
      status: "active",
    });
  }
  revalidatePath("/", "layout");
  redirect(`/${formData.get("locale")}/admin/categories`);
}

export async function deleteCategory(id: number) {
  await requireRole("categories");
  const db = getDb();
  const count = await adminCountEstablishmentsByCategory(id);
  if (count > 0) {
    throw new Error(
      `Cette catégorie contient encore ${count} établissement(s). Déplacez-les vers une autre catégorie ou supprimez-les avant de pouvoir supprimer la catégorie.`
    );
  }
  await db.delete(subcategories).where(eq(subcategories.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/", "layout");
}

export async function setCategoryStatus(id: number, status: "active" | "inactive") {
  await requireRole("categories");
  const db = getDb();
  await db.update(categories).set({ status }).where(eq(categories.id, id));
  revalidatePath("/", "layout");
}

// ---- Cities ----
// A new city just needs a row here — the public site, pro signup and admin
// screens are all already parameterized by cityId/ville, so nothing else has
// to be built or deployed to open it up.
export async function upsertCity(formData: FormData) {
  await requireRole("cities");
  const db = getDb();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const name = String(formData.get("name") ?? "");
  const requestedSlug = slugify(String(formData.get("slug") ?? "") || name);

  if (RESERVED_TOP_LEVEL_SLUGS.includes(requestedSlug)) {
    throw new Error(
      `"${requestedSlug}" est déjà utilisé par une page du site et ne peut pas servir de ville. Choisissez un autre nom.`
    );
  }
  const slugTaken = await db
    .select()
    .from(cities)
    .where(and(eq(cities.slug, requestedSlug), id ? ne(cities.id, id) : undefined));
  if (slugTaken.length > 0) {
    throw new Error(`"${requestedSlug}" est déjà utilisé par une autre ville.`);
  }

  const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
  const translations = await translateFields({ name }, targetLocales, "fr");
  const localizedName = { fr: name, ...translations.name };

  const data = {
    slug: requestedSlug,
    name: localizedName,
    lat: formData.get("lat") ? Number(formData.get("lat")) : null,
    lng: formData.get("lng") ? Number(formData.get("lng")) : null,
    heroImage: String(formData.get("heroImage") ?? "") || null,
  };

  if (id) {
    await db.update(cities).set(data).where(eq(cities.id, id));
  } else {
    await db.insert(cities).values({ ...data, status: "active" });
  }
  revalidatePath("/", "layout");
  redirect(`/${formData.get("locale")}/admin/villes`);
}

export async function setCityStatus(id: number, status: "active" | "inactive") {
  await requireRole("cities");
  const db = getDb();
  await db.update(cities).set({ status }).where(eq(cities.id, id));
  revalidatePath("/", "layout");
}

export async function moveCategory(id: number, direction: "up" | "down") {
  await requireRole("categories");
  const db = getDb();
  const all = await db.select().from(categories).orderBy(asc(categories.order), asc(categories.id));
  const index = all.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swap = all[swapIndex];
  await db.update(categories).set({ order: swap.order }).where(eq(categories.id, current.id));
  await db.update(categories).set({ order: current.order }).where(eq(categories.id, swap.id));
  revalidatePath("/", "layout");
}

// ---- Subcategories ----
export async function upsertSubcategory(formData: FormData) {
  await requireRole("categories");
  const db = getDb();
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const categoryId = Number(formData.get("categoryId"));
  const name = String(formData.get("name") ?? "");
  const requestedSlug = slugify(String(formData.get("slug") ?? "") || name);

  const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
  const translations = await translateFields({ name }, targetLocales, "fr");
  const localizedName = { fr: name, ...translations.name };

  if (id) {
    await db.update(subcategories).set({ name: localizedName, slug: requestedSlug }).where(eq(subcategories.id, id));
  } else {
    const existing = await db.select({ order: subcategories.order }).from(subcategories).where(eq(subcategories.categoryId, categoryId));
    const nextOrder = existing.reduce((max, s) => Math.max(max, s.order ?? 0), 0) + 10;
    await db.insert(subcategories).values({ categoryId, slug: requestedSlug, name: localizedName, order: nextOrder });
  }
  revalidatePath("/", "layout");
  redirect(`/${formData.get("locale")}/admin/categories/${categoryId}`);
}

export async function deleteSubcategory(id: number) {
  await requireRole("categories");
  const db = getDb();
  const rows = await db.select().from(subcategories).where(eq(subcategories.id, id));
  const sub = rows[0];
  if (!sub) return;

  const count = await adminCountEstablishmentsBySubcategory(sub.categoryId, sub.slug);
  if (count > 0) {
    throw new Error(
      `Cette sous-catégorie contient encore ${count} établissement(s). Changez leur sous-catégorie avant de pouvoir la supprimer.`
    );
  }
  await db.delete(subcategories).where(eq(subcategories.id, id));
  revalidatePath("/", "layout");
}

export async function moveSubcategory(id: number, direction: "up" | "down") {
  await requireRole("categories");
  const db = getDb();
  const rows = await db.select().from(subcategories).where(eq(subcategories.id, id));
  const sub = rows[0];
  if (!sub) return;

  const all = await db
    .select()
    .from(subcategories)
    .where(eq(subcategories.categoryId, sub.categoryId))
    .orderBy(asc(subcategories.order), asc(subcategories.id));
  const index = all.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swap = all[swapIndex];
  await db.update(subcategories).set({ order: swap.order }).where(eq(subcategories.id, current.id));
  await db.update(subcategories).set({ order: current.order }).where(eq(subcategories.id, swap.id));
  revalidatePath("/", "layout");
}

// ---- Nav (unified builtin + category + section ordering) ----
export async function setBuiltinNavLabel(formData: FormData) {
  await requireRole("nav");
  const db = getDb();
  const key = String(formData.get("key") ?? "");
  const name = String(formData.get("name") ?? "");

  if (!name.trim()) {
    await db.update(modules).set({ label: null }).where(eq(modules.key, key));
  } else {
    const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
    const translations = await translateFields({ name }, targetLocales, "fr");
    await db.update(modules).set({ label: { fr: name, ...translations.name } }).where(eq(modules.key, key));
  }
  revalidatePath("/", "layout");
  redirect(`/${formData.get("locale")}/admin/nav`);
}

async function setNavItemOrder(item: { type: "builtin" | "category" | "section"; id: number }, order: number) {
  const db = getDb();
  if (item.type === "builtin") await db.update(modules).set({ order }).where(eq(modules.id, item.id));
  else if (item.type === "category") await db.update(categories).set({ order }).where(eq(categories.id, item.id));
  else await db.update(siteSections).set({ order }).where(eq(siteSections.id, item.id));
}

export async function moveNavItem(type: "builtin" | "category" | "section", id: number, direction: "up" | "down") {
  await requireRole("nav");
  const all = await getNavItems();
  const index = all.findIndex((item) => item.type === type && item.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swap = all[swapIndex];
  await setNavItemOrder(current, swap.order);
  await setNavItemOrder(swap, current.order);
  revalidatePath("/", "layout");
}

// ---- Professionals ----
export async function setProfessionalStatus(
  id: number,
  status: "pending" | "validated" | "refused" | "suspended"
) {
  await requireRole("professionals");
  const db = getDb();
  await db.update(professionals).set({ status }).where(eq(professionals.id, id));

  // The establishment fiche submitted alongside the application goes live
  // only once the professional is validated; it's hidden again if refused
  // or suspended.
  if (status === "validated") {
    const [rows, [establishment]] = await Promise.all([
      db.select().from(professionals).where(eq(professionals.id, id)),
      db
        .update(establishments)
        .set({ status: "active" })
        .where(eq(establishments.professionalId, id))
        .returning(),
    ]);
    const pro = rows[0];

    if (pro) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(pro.clerkUserId, {
        publicMetadata: { role: "professional" satisfies Role },
      });
    }

    if (pro?.email) {
      let listingUrl: string | null = null;
      let catalogLabel = qrFeatureLabel(undefined, "fr");
      if (establishment) {
        const [category] = await db.select().from(categories).where(eq(categories.id, establishment.categoryId));
        if (category) {
          listingUrl = `https://essaouirainside.com/fr/${category.slug}/${establishment.slug}`;
          catalogLabel = qrFeatureLabel(category.type, "fr");
        }
      }
      waitUntil(
        sendActivationEmail(pro.email, pro.contactName || pro.companyName, pro.companyName, listingUrl, catalogLabel)
      );
    }
  } else if (status === "refused" || status === "suspended") {
    await db.update(establishments).set({ status: "disabled" }).where(eq(establishments.professionalId, id));
  }

  revalidatePath("/", "layout");
}

export async function deleteProfessional(id: number) {
  await requireRole("professionals");
  const db = getDb();

  const [professional] = await db.select().from(professionals).where(eq(professionals.id, id));
  if (!professional) return;

  const linkedEstablishments = await db.select().from(establishments).where(eq(establishments.professionalId, id));
  for (const est of linkedEstablishments) {
    await db.delete(reviews).where(eq(reviews.establishmentId, est.id));
    await db.delete(favorites).where(eq(favorites.establishmentId, est.id));
    await db.delete(labelEvaluations).where(eq(labelEvaluations.establishmentId, est.id));
    await db.delete(labelBadges).where(eq(labelBadges.establishmentId, est.id));
  }

  await db.delete(labelApplications).where(eq(labelApplications.professionalId, id));
  await db.delete(establishments).where(eq(establishments.professionalId, id));
  await db.delete(subscriptions).where(eq(subscriptions.professionalId, id));
  await db.delete(invoices).where(eq(invoices.professionalId, id));
  await db.delete(serviceOrders).where(eq(serviceOrders.professionalId, id));
  await db.delete(professionals).where(eq(professionals.id, id));

  try {
    const client = await clerkClient();
    await client.users.deleteUser(professional.clerkUserId);
  } catch {
    // DB cleanup already succeeded; the Clerk account may already be gone.
  }

  revalidatePath("/", "layout");
}

export async function changeSubscriptionPlan(
  professionalId: number,
  planKey: string,
  billingCycle: "monthly" | "yearly"
) {
  await requireRole("subscriptions");
  const db = getDb();
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.professionalId, professionalId));

  if (existing[0]) {
    await db
      .update(subscriptions)
      .set({ planKey, billingCycle })
      .where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values({
      professionalId,
      planKey,
      billingCycle,
      status: "manual",
      paymentMethod: "manual",
    });
  }
  revalidatePath("/", "layout");
}

// ---- Reviews ----
export async function setReviewStatus(id: number, status: "pending" | "approved" | "rejected") {
  await requireRole("reviews");
  const db = getDb();
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  revalidatePath("/", "layout");
}

export async function deleteReview(id: number) {
  await requireRole("reviews");
  const db = getDb();
  await db.delete(reviews).where(eq(reviews.id, id));
  revalidatePath("/", "layout");
}

// ---- Ad campaigns ----
export async function createAdCampaign(formData: FormData) {
  await requireRole("ads");
  const db = getDb();
  await db.insert(adCampaigns).values({
    title: String(formData.get("title") ?? ""),
    placement: String(formData.get("placement") ?? "home"),
    campaignType: String(formData.get("campaignType") ?? "banniere"),
    startDate: new Date(String(formData.get("startDate"))),
    endDate: formData.get("endDate") ? new Date(String(formData.get("endDate"))) : null,
    status: "active",
  });
  revalidatePath("/", "layout");
}

export async function setAdCampaignStatus(id: number, status: "active" | "paused" | "ended") {
  await requireRole("ads");
  const db = getDb();
  await db.update(adCampaigns).set({ status }).where(eq(adCampaigns.id, id));
  revalidatePath("/", "layout");
}

export async function deleteAdCampaign(id: number) {
  await requireRole("ads");
  const db = getDb();
  await db.delete(adCampaigns).where(eq(adCampaigns.id, id));
  revalidatePath("/", "layout");
}

// ---- Newsletter ----
export async function deleteNewsletterSubscriber(id: number) {
  await requireRole("newsletter");
  const db = getDb();
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
  revalidatePath("/", "layout");
}

// ---- Modules ----
export async function setModuleStatus(key: string, status: "active" | "inactive" | "maintenance") {
  await requireRole("modules");
  const db = getDb();
  await db.update(modules).set({ status }).where(eq(modules.key, key));
  revalidatePath("/", "layout");
}

// ---- Site settings ----
// cityId null = the global wetravelgo.com landing page's branding row.
export async function updateSiteSettings(
  data: {
    siteName: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    contactEmail?: string;
    heroImages?: string[];
  },
  cityId: number | null
) {
  await requireRole("settings");
  const db = getDb();
  const existing = await db
    .select()
    .from(siteSettings)
    .where(cityId === null ? isNull(siteSettings.cityId) : eq(siteSettings.cityId, cityId))
    .limit(1);
  if (existing[0]) {
    await db.update(siteSettings).set(data).where(eq(siteSettings.id, existing[0].id));
  } else {
    await db.insert(siteSettings).values({ ...data, cityId });
  }
  revalidatePath("/", "layout");
}

// ---- Users (Clerk-backed) ----
export async function setUserRole(clerkUserId: string, role: Role) {
  await requireRole("users");
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerkUserId, { publicMetadata: { role } });
  revalidatePath("/", "layout");
}

export async function setUserBanned(clerkUserId: string, banned: boolean) {
  await requireRole("users");
  const client = await clerkClient();
  if (banned) {
    await client.users.banUser(clerkUserId);
  } else {
    await client.users.unbanUser(clerkUserId);
  }
  revalidatePath("/", "layout");
}

export async function deleteUser(clerkUserId: string) {
  await requireRole("users");
  const client = await clerkClient();
  await client.users.deleteUser(clerkUserId);
  revalidatePath("/", "layout");
}

// ---- Emergency contacts (Assistance) ----
export async function upsertEmergencyContact(formData: FormData) {
  await requireRole("assistance");
  const db = getDb();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const name = String(formData.get("name") ?? "");
  const hours = String(formData.get("hours") ?? "");
  const notes = String(formData.get("notes") ?? "");

  const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
  const translations = await translateFields({ name, hours, notes }, targetLocales, "fr");

  const data = {
    cityId: Number(formData.get("cityId")),
    category: String(formData.get("category") ?? "urgences"),
    name: { fr: name, ...translations.name },
    phone: String(formData.get("phone") ?? "") || null,
    whatsapp: String(formData.get("whatsapp") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    lat: formData.get("lat") ? Number(formData.get("lat")) : null,
    lng: formData.get("lng") ? Number(formData.get("lng")) : null,
    hours: hours ? { fr: hours, ...translations.hours } : null,
    notes: notes ? { fr: notes, ...translations.notes } : null,
    website: String(formData.get("website") ?? "") || null,
    country: String(formData.get("country") ?? "") || null,
    featured: formData.get("featured") === "on",
  };

  if (id) {
    await db.update(emergencyContacts).set(data).where(eq(emergencyContacts.id, id));
  } else {
    await db.insert(emergencyContacts).values(data);
  }
  revalidatePath("/", "layout");
  redirect(`/${formData.get("locale")}/admin/assistance`);
}

export async function deleteEmergencyContact(id: number) {
  await requireRole("assistance");
  const db = getDb();
  await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
  revalidatePath("/", "layout");
}

export async function toggleEmergencyContactFeatured(id: number, featured: boolean) {
  await requireRole("assistance");
  const db = getDb();
  await db.update(emergencyContacts).set({ featured }).where(eq(emergencyContacts.id, id));
  revalidatePath("/", "layout");
}

// ---- Label "Essaouira Inside Approved" ----
export async function createLabelEvaluation(formData: FormData) {
  const { user } = await requireRole("label");
  const db = getDb();

  const establishmentId = Number(formData.get("establishmentId"));
  const scores = Object.fromEntries(
    LABEL_CRITERIA.map(({ key }) => [key, Math.max(0, Math.min(10, Number(formData.get(key)) || 0))])
  ) as Record<(typeof LABEL_CRITERIA)[number]["key"], number>;
  const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);

  await db.insert(labelEvaluations).values({
    establishmentId,
    evaluatorClerkUserId: user?.id ?? "unknown",
    evaluatorName: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || undefined : undefined,
    ...scores,
    totalScore,
    comments: String(formData.get("comments") ?? "") || null,
  });

  await db.update(establishments).set({ labelScore: totalScore }).where(eq(establishments.id, establishmentId));

  revalidatePath("/", "layout");
  redirect(`/${formData.get("locale")}/admin/establissements/${establishmentId}`);
}

export async function setLabelStatus(
  establishmentId: number,
  status: "approved" | "refused" | "suspended" | "revoked"
) {
  await requireRole("label");
  const db = getDb();

  await db
    .update(establishments)
    .set({
      labelStatus: status === "refused" ? "none" : status,
      labelAwardedAt: status === "approved" ? new Date() : undefined,
    })
    .where(eq(establishments.id, establishmentId));

  const lastEvaluation = await db
    .select()
    .from(labelEvaluations)
    .where(eq(labelEvaluations.establishmentId, establishmentId))
    .orderBy(desc(labelEvaluations.createdAt))
    .limit(1);
  if (lastEvaluation[0]) {
    await db.update(labelEvaluations).set({ decision: status }).where(eq(labelEvaluations.id, lastEvaluation[0].id));
  }

  // Mirror the decision onto the open application for this establishment, if any.
  if (status === "approved" || status === "refused") {
    const openApplications = await db
      .select()
      .from(labelApplications)
      .where(eq(labelApplications.establishmentId, establishmentId))
      .orderBy(desc(labelApplications.createdAt))
      .limit(1);
    if (openApplications[0] && !["approved", "refused"].includes(openApplications[0].status)) {
      await db
        .update(labelApplications)
        .set({ status })
        .where(eq(labelApplications.id, openApplications[0].id));
    }
  }

  // The label is awarded per calendar year — maintain the annual badge history.
  const year = new Date().getFullYear();
  const existingBadge = await db
    .select()
    .from(labelBadges)
    .where(and(eq(labelBadges.establishmentId, establishmentId), eq(labelBadges.year, year)));

  if (status === "approved") {
    if (existingBadge[0]) {
      await db.update(labelBadges).set({ status: "active" }).where(eq(labelBadges.id, existingBadge[0].id));
    } else {
      await db.insert(labelBadges).values({
        establishmentId,
        year,
        status: "active",
        evaluationId: lastEvaluation[0]?.id,
        certificateNumber: `EIA-${year}-${String(establishmentId).padStart(4, "0")}`,
      });
    }
  } else if ((status === "suspended" || status === "revoked") && existingBadge[0]) {
    await db.update(labelBadges).set({ status: "revoked" }).where(eq(labelBadges.id, existingBadge[0].id));
  }

  revalidatePath("/", "layout");
}

export async function setLabelApplicationStatus(
  id: number,
  status: "info_requested" | "visit_scheduled" | "on_hold" | "refused"
) {
  await requireRole("label");
  const db = getDb();
  await db.update(labelApplications).set({ status }).where(eq(labelApplications.id, id));
  revalidatePath("/", "layout");
}
