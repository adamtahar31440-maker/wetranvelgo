"use server";

import { safeCurrentUser as currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { waitUntil } from "@vercel/functions";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { professionals, establishments, categories, serviceOrders, labelApplications } from "@/db/schema";
import {
  getProfessionalByClerkId,
  getLabelApplicationByEstablishmentId,
  getSubscriptionByProfessionalId,
  getSubscriptionPlans,
} from "@/lib/admin-data";
import { ALL_LOCALES } from "@/lib/localized-form";
import { translateFields } from "@/lib/translate";
import { slugify } from "@/lib/slug";
import { sendWelcomeEmail } from "@/lib/email";
import { truncate } from "@/lib/truncate";

const OPEN_APPLICATION_STATUSES = ["pending", "info_requested", "visit_scheduled", "on_hold"];

// A newly-signed-up pro (status "pending") can set up their fiche/menu right
// away instead of being blocked until an admin reviews them — only a negative
// outcome (refused/suspended) should stop them editing. Used by the two
// "set up your listing" actions; applyForLabel/requestMarketplaceService stay
// validated-only since they're post-approval extras, not initial setup.
const PRO_CAN_EDIT_STATUSES = ["pending", "validated"];

// The professional submits their full establishment fiche as part of the
// application itself, so the Super Admin reviews real content (not just a
// company name) before deciding to validate or refuse.
export async function applyAsProfessional(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // The checkbox is `required` client-side, but that's trivially bypassable
  // (disabled JS, direct POST), so re-check server-side before creating an
  // account — acceptance of the CGU/privacy policy must actually be recorded.
  if (formData.get("acceptTerms") !== "on") {
    throw new Error("Vous devez accepter les Conditions Générales d'Utilisation et la Politique de Confidentialité.");
  }

  const db = getDb();
  const existingProfessional = await getProfessionalByClerkId(user.id);
  if (existingProfessional) {
    const [existingEstablishment] = await db
      .select({ id: establishments.id })
      .from(establishments)
      .where(eq(establishments.professionalId, existingProfessional.id));
    // A professional account with no establishment means a previous attempt
    // created the account but crashed before finishing the fiche (e.g. a bad
    // field value the DB rejected) — let them pick up where they left off
    // instead of being silently stuck forever on an account that can never
    // get a listing.
    if (existingEstablishment) return;
  }

  const categoryId = Number(formData.get("categoryId"));
  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId));
  const cityId = Number(formData.get("cityId"));
  const contactName = String(formData.get("contactName") ?? "");

  const requestedLocale = String(formData.get("sourceLocale") ?? "fr");
  const sourceLocale = ALL_LOCALES.includes(requestedLocale) ? requestedLocale : "fr";
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const hours = String(formData.get("hours") ?? "");

  let productsInput: { name: string; price: number | null; category: string | null }[] = [];
  try {
    productsInput = JSON.parse(String(formData.get("products") ?? "[]"));
  } catch {
    productsInput = [];
  }

  // Other on-site activities (e.g. a hotel that also has a restaurant, a shop, a
  // hammam) — kept as simple translated tags rather than real secondary categories,
  // so the establishment still has one canonical category/URL for listings and search.
  const activitiesInput = String(formData.get("otherActivities") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const vacationStart = String(formData.get("vacationStart") ?? "") || null;
  const vacationEnd = String(formData.get("vacationEnd") ?? "") || null;

  const subcategories = formData.getAll("subcategories").map(String).filter(Boolean);
  const avgDailyPriceMadRaw = String(formData.get("avgDailyPriceMad") ?? "");
  const avgDailyPriceMad = avgDailyPriceMadRaw ? Number(avgDailyPriceMadRaw) : null;

  let menuItemsInput: {
    name: string;
    description: string | null;
    price: number | null;
    category: string | null;
    variants: { label: string; price: number }[] | null;
    photo: string | null;
  }[] = [];
  try {
    menuItemsInput = JSON.parse(String(formData.get("menuItems") ?? "[]"));
  } catch {
    menuItemsInput = [];
  }
  const menuPhoto = String(formData.get("menuPhoto") ?? "") || null;
  const menuBanner = String(formData.get("menuBanner") ?? "") || null;

  // Translating into all locales is an LLM call that can take several seconds; running it
  // before the insert made "Enregistrer" feel frozen. Save in the source locale immediately
  // and fill in the other locales afterwards via waitUntil, once the response has been sent.
  const localizedName = { [sourceLocale]: name };
  const localizedDescription = { [sourceLocale]: description };
  const localizedHours = hours ? { [sourceLocale]: hours } : null;
  const products = productsInput.map((p) => ({
    name: { [sourceLocale]: p.name },
    price: p.price,
    category: p.category ? { [sourceLocale]: p.category } : null,
  }));
  const services = activitiesInput.length > 0 ? { [sourceLocale]: activitiesInput } : null;
  const digitalMenu = menuItemsInput.map((it) => ({
    name: { [sourceLocale]: it.name },
    description: it.description ? { [sourceLocale]: it.description } : null,
    price: it.price,
    category: it.category ? { [sourceLocale]: it.category } : null,
    variants:
      it.variants && it.variants.length > 0
        ? it.variants.map((v) => ({ label: { [sourceLocale]: v.label }, price: v.price }))
        : null,
    photo: it.photo ?? null,
  }));

  const professional =
    existingProfessional ??
    (
      await db
        .insert(professionals)
        .values({
          cityId,
          clerkUserId: user.id,
          companyName: truncate(name, 160),
          contactName: truncate(contactName, 160),
          activityType: category?.type ?? "service",
          phone: truncate(String(formData.get("phone") ?? ""), 64),
          email: truncate(user.emailAddresses[0]?.emailAddress ?? String(formData.get("email") ?? ""), 255),
          website: truncate(String(formData.get("website") ?? ""), 255),
          status: "pending",
          termsAcceptedAt: new Date(),
        })
        .returning()
    )[0];

  if (!existingProfessional && professional.email) {
    waitUntil(sendWelcomeEmail(professional.email, contactName || name, name));
  }

  const [establishment] = await db.insert(establishments).values({
    cityId,
    categoryId,
    subcategory: truncate(String(formData.get("subcategory") ?? ""), 64),
    subcategories,
    avgDailyPriceMad,
    slug: truncate(`${slugify(name)}-${professional.id}`, 160),
    name: localizedName,
    description: localizedDescription,
    hours: localizedHours,
    vacationStart,
    vacationEnd,
    address: truncate(String(formData.get("address") ?? ""), 255),
    lat: formData.get("lat") ? Number(formData.get("lat")) : null,
    lng: formData.get("lng") ? Number(formData.get("lng")) : null,
    phone: truncate(String(formData.get("phone") ?? ""), 64),
    whatsapp: truncate(String(formData.get("whatsapp") ?? ""), 64),
    website: truncate(String(formData.get("website") ?? ""), 255),
    instagram: String(formData.get("instagram") ?? "") ? truncate(String(formData.get("instagram")), 255) : null,
    facebook: String(formData.get("facebook") ?? "") ? truncate(String(formData.get("facebook")), 255) : null,
    googleReviewsUrl: String(formData.get("googleReviewsUrl") ?? "")
      ? truncate(String(formData.get("googleReviewsUrl")), 255)
      : null,
    tripadvisorUrl: String(formData.get("tripadvisorUrl") ?? "")
      ? truncate(String(formData.get("tripadvisorUrl")), 255)
      : null,
    priceLevel: truncate(String(formData.get("priceLevel") ?? "€€"), 8),
    products,
    services,
    images: String(formData.get("images") ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    wifi: formData.get("wifi") === "on",
    parking: formData.get("parking") === "on",
    pool: formData.get("pool") === "on",
    airConditioning: formData.get("airConditioning") === "on",
    accessibility: formData.get("accessibility") === "on",
    petsAllowed: formData.get("petsAllowed") === "on",
    // The listing goes live immediately at signup — no waiting on an admin
    // to validate the professional first. Admin review still happens, it
    // just no longer gates public visibility: setProfessionalStatus already
    // sets this back to "disabled" if the pro is later refused/suspended.
    status: "active",
    professionalId: professional.id,
    // Every business gets the digital catalog/QR feature on immediately at
    // signup (labeled differently per category — menu, room rates, catalog...
    // see qrFeatureLabel) — no waiting on an admin to flip it on. Admin can
    // still disable/re-enable it any time from the establishment's admin page.
    menuTranslationEnabled: true,
    digitalMenu,
    menuPhoto,
    menuBanner,
  }).returning();

  const targetLocales = ALL_LOCALES.filter((l) => l !== sourceLocale);
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
    (async () => {
      // Persisted incrementally as each chunk comes back (see translateFields'
      // onChunk) rather than once at the very end — a fiche with many products
      // can take long enough that the function gets cut off before a single
      // final write, which used to mean the whole background job vanished.
      const accumulated: Record<string, Record<string, string>> = {};
      let writeQueue: Promise<unknown> = Promise.resolve();
      const persist = () => {
        const update: Partial<typeof establishments.$inferInsert> = {
          name: { ...localizedName, ...accumulated.name },
          description: { ...localizedDescription, ...accumulated.description },
        };
        if (localizedHours) {
          update.hours = { ...localizedHours, ...accumulated.hours };
        }
        if (products.length > 0) {
          update.products = productsInput.map((p, i) => ({
            name: { [sourceLocale]: p.name, ...accumulated[`product_${i}`] },
            price: p.price,
            category: p.category ? { [sourceLocale]: p.category, ...accumulated[`category_${i}`] } : null,
          }));
        }
        if (services) {
          const servicesByLocale: Record<string, string[]> = { [sourceLocale]: activitiesInput };
          for (const locale of targetLocales) {
            servicesByLocale[locale] = activitiesInput.map((text, i) => accumulated[`activity_${i}`]?.[locale] ?? text);
          }
          update.services = servicesByLocale;
        }
        writeQueue = writeQueue.then(() =>
          db.update(establishments).set(update).where(eq(establishments.id, establishment.id))
        );
      };
      try {
        await translateFields(translationFields, targetLocales, sourceLocale, (chunk) => {
          if (Object.keys(chunk).length === 0) return;
          Object.assign(accumulated, chunk);
          persist();
        });
        await writeQueue;
      } catch (err) {
        console.error("Background translation failed for establishment", establishment.id, err);
      }
    })()
  );

  if (menuItemsInput.length > 0) {
    // Same dedup-by-text approach as updateDigitalMenu (see there for why) —
    // translating the same repeated category/variant label once instead of
    // once per item keeps chunks small enough not to risk translateFields'
    // size limits on a big menu submitted straight at signup.
    const categoryKeys = new Map<string, string>();
    function categoryFieldKey(category: string): string {
      let key = categoryKeys.get(category);
      if (!key) {
        key = `menuCategory_${categoryKeys.size}`;
        categoryKeys.set(category, key);
      }
      return key;
    }
    const variantKeys = new Map<string, string>();
    function variantFieldKey(label: string): string {
      let key = variantKeys.get(label);
      if (!key) {
        key = `menuVariant_${variantKeys.size}`;
        variantKeys.set(label, key);
      }
      return key;
    }

    const menuTranslationFields: Record<string, string> = {};
    menuItemsInput.forEach((it, i) => {
      menuTranslationFields[`menuName_${i}`] = it.name;
      if (it.description) menuTranslationFields[`menuDescription_${i}`] = it.description;
      if (it.category) menuTranslationFields[categoryFieldKey(it.category)] = it.category;
      (it.variants ?? []).forEach((v) => {
        menuTranslationFields[variantFieldKey(v.label)] = v.label;
      });
    });

    const buildTranslatedMenu = (translations: Record<string, Record<string, string>>) =>
      menuItemsInput.map((it, i) => ({
        name: { [sourceLocale]: it.name, ...translations[`menuName_${i}`] },
        description: it.description
          ? { [sourceLocale]: it.description, ...translations[`menuDescription_${i}`] }
          : null,
        price: it.price,
        category: it.category
          ? { [sourceLocale]: it.category, ...translations[categoryKeys.get(it.category)!] }
          : null,
        variants:
          it.variants && it.variants.length > 0
            ? it.variants.map((v) => ({
                label: { [sourceLocale]: v.label, ...translations[variantKeys.get(v.label)!] },
                price: v.price,
              }))
            : null,
        photo: it.photo ?? null,
      }));

    waitUntil(
      (async () => {
        // Same incremental-persistence reasoning as the fiche translation above —
        // a 100+ dish menu can take minutes to translate (dozens of chunks), so
        // each finished chunk is saved right away instead of only at the end.
        const accumulated: Record<string, Record<string, string>> = {};
        let writeQueue: Promise<unknown> = Promise.resolve();
        try {
          await translateFields(menuTranslationFields, targetLocales, sourceLocale, (chunk) => {
            if (Object.keys(chunk).length === 0) return;
            Object.assign(accumulated, chunk);
            writeQueue = writeQueue.then(() =>
              db
                .update(establishments)
                .set({ digitalMenu: buildTranslatedMenu(accumulated) })
                .where(eq(establishments.id, establishment.id))
            );
          });
          await writeQueue;
        } catch (err) {
          console.error("Background menu translation failed for establishment", establishment.id, err);
        }
      })()
    );
  }

  revalidatePath("/", "layout");
}

// One form, one button: the fiche and the digital menu (when the establishment
// is a restaurant) save together. Both are saved immediately in French, then
// translated into every other locale in the background via waitUntil — a
// pattern shared with applyAsProfessional so signup and dashboard behave the
// same way. Fields whose French value hasn't changed since the last save are
// skipped entirely (reusing the stored translations) so editing e.g. just the
// phone number doesn't re-translate an unrelated, possibly large, menu.
export async function updateOwnEstablishment(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const db = getDb();
  const professional = await getProfessionalByClerkId(user.id);
  // Pending pros can already set up their fiche while awaiting review — only a
  // refused/suspended outcome blocks editing. The listing itself is already
  // public from signup (applyAsProfessional); admin review no longer gates
  // visibility, it can only take it back down (setProfessionalStatus).
  if (!professional || !PRO_CAN_EDIT_STATUSES.includes(professional.status)) throw new Error("Forbidden");

  const id = Number(formData.get("id"));
  const [establishment] = await db.select().from(establishments).where(eq(establishments.id, id));
  if (!establishment || establishment.professionalId !== professional.id) throw new Error("Forbidden");

  const locale = String(formData.get("locale") ?? "fr");

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

  const subcategories = formData.getAll("subcategories").map(String).filter(Boolean);
  const avgDailyPriceMadRaw = String(formData.get("avgDailyPriceMad") ?? "");
  const avgDailyPriceMad = avgDailyPriceMadRaw ? Number(avgDailyPriceMadRaw) : null;

  let menuItemsInput: {
    name: string;
    description: string | null;
    price: number | null;
    category: string | null;
    variants: { label: string; price: number }[] | null;
    photo: string | null;
  }[] = [];
  try {
    menuItemsInput = JSON.parse(String(formData.get("menuItems") ?? "[]"));
  } catch {
    menuItemsInput = [];
  }
  const menuPhoto = String(formData.get("menuPhoto") ?? "") || null;
  const menuBanner = String(formData.get("menuBanner") ?? "") || null;

  const normalizeText = (s: string) => s.replace(/\r\n/g, "\n");

  const targetLocales = ALL_LOCALES.filter((l) => l !== "fr");
  const translationFields: Record<string, string> = {};

  const nameChanged = normalizeText(name) !== normalizeText(establishment.name.fr);
  if (nameChanged) translationFields.name = name;

  const descriptionChanged = normalizeText(description) !== normalizeText(establishment.description.fr);
  if (descriptionChanged) translationFields.description = description;

  const existingHours = establishment.hours?.fr ?? "";
  const hoursChanged = hours !== existingHours;
  if (hoursChanged) translationFields.hours = hours;

  const originalProducts = (establishment.products ?? []).map((p) => ({
    name: p.name.fr,
    price: p.price,
    category: p.category?.fr ?? null,
  }));
  const productsUnchanged = JSON.stringify(productsInput) === JSON.stringify(originalProducts);
  if (!productsUnchanged) {
    productsInput.forEach((p, i) => {
      translationFields[`product_${i}`] = p.name;
      if (p.category) translationFields[`category_${i}`] = p.category;
    });
  }

  const originalActivities = establishment.services?.fr ?? [];
  const activitiesUnchanged = JSON.stringify(activitiesInput) === JSON.stringify(originalActivities);
  if (!activitiesUnchanged) {
    activitiesInput.forEach((a, i) => {
      translationFields[`activity_${i}`] = a;
    });
  }

  // Category names and variant labels ("Plats principaux", "Verre"...) repeat
  // identically across many items — translating each occurrence as its own
  // field bloated the request enough (more fields/chars per chunk than
  // translateFields' size limits comfortably allow) that a large category's
  // whole chunk could silently fail and leave it and its dishes untranslated.
  // Deduping by text means one translation call per unique string instead of
  // one per item, which also fixes that same category consistently across
  // every item that uses it.
  const menuCategoryKeys = new Map<string, string>();
  function menuCategoryFieldKey(category: string): string {
    let key = menuCategoryKeys.get(category);
    if (!key) {
      key = `menuCategory_${menuCategoryKeys.size}`;
      menuCategoryKeys.set(category, key);
    }
    return key;
  }
  const menuVariantKeys = new Map<string, string>();
  function menuVariantFieldKey(label: string): string {
    let key = menuVariantKeys.get(label);
    if (!key) {
      key = `menuVariant_${menuVariantKeys.size}`;
      menuVariantKeys.set(label, key);
    }
    return key;
  }

  // Key order and null-vs-[] here must match MenuEditor's own serialization
  // (name, description, category, price, variants, photo) exactly — the
  // unchanged-check below compares via JSON.stringify, which is sensitive to
  // both.
  const originalMenu = (establishment.digitalMenu ?? []).map((it) => ({
    name: it.name.fr,
    description: it.description?.fr ?? null,
    category: it.category?.fr ?? null,
    price: it.price,
    variants: it.variants && it.variants.length > 0 ? it.variants.map((v) => ({ label: v.label.fr, price: v.price })) : null,
    photo: it.photo ?? null,
  }));
  const menuUnchanged = JSON.stringify(menuItemsInput) === JSON.stringify(originalMenu);
  if (!menuUnchanged) {
    menuItemsInput.forEach((it, i) => {
      translationFields[`menuName_${i}`] = it.name;
      if (it.description) translationFields[`menuDescription_${i}`] = it.description;
      if (it.category) translationFields[menuCategoryFieldKey(it.category)] = it.category;
      (it.variants ?? []).forEach((v) => {
        translationFields[menuVariantFieldKey(v.label)] = v.label;
      });
    });
  }

  const [subscription, plans] = await Promise.all([
    getSubscriptionByProfessionalId(professional.id),
    getSubscriptionPlans(),
  ]);
  const currentPlanKey = subscription?.status === "active" ? subscription.planKey : "starter";
  const maxPhotos = plans.find((p) => p.key === currentPlanKey)?.maxPhotos ?? null;

  let images = String(formData.get("images") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (typeof maxPhotos === "number") images = images.slice(0, maxPhotos);

  // Immediate save: anything unchanged keeps its existing (already multi-locale)
  // value; anything changed goes in with French only for now, filled in below.
  await db
    .update(establishments)
    .set({
      name: nameChanged ? { fr: name } : establishment.name,
      description: descriptionChanged ? { fr: description } : establishment.description,
      address: truncate(String(formData.get("address") ?? ""), 255),
      lat: formData.get("lat") ? Number(formData.get("lat")) : establishment.lat,
      lng: formData.get("lng") ? Number(formData.get("lng")) : establishment.lng,
      phone: truncate(String(formData.get("phone") ?? ""), 64),
      whatsapp: truncate(String(formData.get("whatsapp") ?? ""), 64),
      website: truncate(String(formData.get("website") ?? ""), 255),
      instagram: String(formData.get("instagram") ?? "") ? truncate(String(formData.get("instagram")), 255) : null,
      facebook: String(formData.get("facebook") ?? "") ? truncate(String(formData.get("facebook")), 255) : null,
      googleReviewsUrl: String(formData.get("googleReviewsUrl") ?? "")
        ? truncate(String(formData.get("googleReviewsUrl")), 255)
        : null,
      tripadvisorUrl: String(formData.get("tripadvisorUrl") ?? "")
        ? truncate(String(formData.get("tripadvisorUrl")), 255)
        : null,
      hours: hoursChanged ? { fr: hours } : establishment.hours,
      vacationStart,
      vacationEnd,
      priceLevel: truncate(String(formData.get("priceLevel") ?? establishment.priceLevel ?? "€€"), 8),
      subcategories,
      avgDailyPriceMad,
      images,
      products: productsUnchanged
        ? establishment.products
        : productsInput.map((p) => ({ name: { fr: p.name }, price: p.price, category: p.category ? { fr: p.category } : null })),
      services: activitiesUnchanged
        ? establishment.services
        : activitiesInput.length > 0
          ? { fr: activitiesInput }
          : null,
      wifi: formData.get("wifi") === "on",
      parking: formData.get("parking") === "on",
      accessibility: formData.get("accessibility") === "on",
      pool: formData.get("pool") === "on",
      airConditioning: formData.get("airConditioning") === "on",
      petsAllowed: formData.get("petsAllowed") === "on",
      digitalMenu: menuUnchanged
        ? establishment.digitalMenu
        : menuItemsInput.map((it) => ({
            name: { fr: it.name },
            description: it.description ? { fr: it.description } : null,
            price: it.price,
            category: it.category ? { fr: it.category } : null,
            variants:
              it.variants && it.variants.length > 0
                ? it.variants.map((v) => ({ label: { fr: v.label }, price: v.price }))
                : null,
            photo: it.photo ?? null,
          })),
      menuPhoto,
      menuBanner,
    })
    .where(and(eq(establishments.id, id), eq(establishments.professionalId, professional.id)));

  if (Object.keys(translationFields).length > 0) {
    const buildUpdate = (translations: Record<string, Record<string, string>>) => {
      const update: Partial<typeof establishments.$inferInsert> = {};
      if (nameChanged) update.name = { fr: name, ...translations.name };
      if (descriptionChanged) update.description = { fr: description, ...translations.description };
      if (hoursChanged) update.hours = { fr: hours, ...translations.hours };

      if (!productsUnchanged) {
        update.products = productsInput.map((p, i) => ({
          name: { fr: p.name, ...translations[`product_${i}`] },
          price: p.price,
          category: p.category ? { fr: p.category, ...translations[`category_${i}`] } : null,
        }));
      }

      if (!activitiesUnchanged && activitiesInput.length > 0) {
        update.services = {
          fr: activitiesInput,
          ...Object.fromEntries(
            targetLocales.map((l) => [
              l,
              activitiesInput.map((text, i) => translations[`activity_${i}`]?.[l] || text),
            ])
          ),
        };
      }

      if (!menuUnchanged) {
        update.digitalMenu = menuItemsInput.map((it, i) => ({
          name: { fr: it.name, ...translations[`menuName_${i}`] },
          description: it.description
            ? { fr: it.description, ...translations[`menuDescription_${i}`] }
            : null,
          price: it.price,
          category: it.category
            ? { fr: it.category, ...translations[menuCategoryKeys.get(it.category)!] }
            : null,
          variants:
            it.variants && it.variants.length > 0
              ? it.variants.map((v) => ({
                  label: { fr: v.label, ...translations[menuVariantKeys.get(v.label)!] },
                  price: v.price,
                }))
              : null,
          photo: it.photo ?? null,
        }));
      }
      return update;
    };

    waitUntil(
      (async () => {
        // Incremental persistence (see applyAsProfessional) — this combined job can
        // include a large menu on top of the fiche fields, so it's especially prone
        // to running past the function's time budget before a single final write.
        const accumulated: Record<string, Record<string, string>> = {};
        let writeQueue: Promise<unknown> = Promise.resolve();
        try {
          await translateFields(translationFields, targetLocales, "fr", (chunk) => {
            if (Object.keys(chunk).length === 0) return;
            Object.assign(accumulated, chunk);
            const update = buildUpdate(accumulated);
            if (Object.keys(update).length > 0) {
              writeQueue = writeQueue.then(() =>
                db.update(establishments).set(update).where(eq(establishments.id, id))
              );
            }
          });
          await writeQueue;
        } catch (err) {
          console.error("Background translation failed for establishment", id, err);
        }
      })()
    );
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/pro/dashboard?updated=1`);
}

export async function applyForLabel(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const db = getDb();
  const professional = await getProfessionalByClerkId(user.id);
  if (!professional || professional.status !== "validated") throw new Error("Forbidden");

  const establishmentId = Number(formData.get("establishmentId"));
  const [establishment] = await db.select().from(establishments).where(eq(establishments.id, establishmentId));
  if (!establishment || establishment.professionalId !== professional.id) throw new Error("Forbidden");

  const existing = await getLabelApplicationByEstablishmentId(establishmentId);
  if (existing && OPEN_APPLICATION_STATUSES.includes(existing.status)) return;

  if (formData.get("charterAccepted") !== "on") {
    throw new Error("La charte du label doit être acceptée.");
  }

  await db.insert(labelApplications).values({
    professionalId: professional.id,
    establishmentId,
    contactName: String(formData.get("contactName") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    website: String(formData.get("website") ?? "") || null,
    socialLinks: String(formData.get("socialLinks") ?? "") || null,
    activityDescription: String(formData.get("activityDescription") ?? "") || null,
    images: String(formData.get("images") ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    motivation: String(formData.get("motivation") ?? "") || null,
    charterAccepted: true,
    status: "pending",
  });

  revalidatePath("/", "layout");
}

export async function requestMarketplaceService(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const db = getDb();
  const professional = await getProfessionalByClerkId(user.id);
  if (!professional || professional.status !== "validated") throw new Error("Forbidden");

  await db.insert(serviceOrders).values({
    professionalId: professional.id,
    serviceKey: String(formData.get("serviceKey") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    status: "requested",
  });

  revalidatePath("/", "layout");
}
