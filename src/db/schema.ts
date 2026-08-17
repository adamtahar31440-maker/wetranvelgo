import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  jsonb,
  timestamp,
  doublePrecision,
  integer,
  date,
  unique,
} from "drizzle-orm/pg-core";

// Localized text is stored as JSONB: { fr: "...", en: "...", ar: "..." }
export type Localized = Record<string, string>;
export type LocalizedList = Record<string, string[]>;

// One row per city the platform covers (wetravelgo.com/{slug}). Everything
// location-bound (establishments, professionals, content, emergency
// contacts, per-city site settings) hangs off cityId so opening a new city
// is a data operation (add a row here) rather than a code change.
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(), // URL segment, e.g. "essaouira"
  name: jsonb("name").$type<Localized>().notNull(),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active|inactive (inactive 404s publicly)
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  heroImage: varchar("hero_image", { length: 255 }), // shown on the wetravelgo.com city picker
  // Optional tide-widget locations for coastal cities (id/name/lat/lng per spot,
  // e.g. Essaouira/Diabat/Sidi Kaouki) — empty means no tide widget for this city.
  tideLocations: jsonb("tide_locations").$type<{ id: string; name: Localized; lat: number; lng: number }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 32 }).notNull(), // legacy join key, equals slug for categories created after the admin CRUD shipped
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: jsonb("name").$type<Localized>().notNull(),
  icon: varchar("icon", { length: 64 }),
  order: integer("order").default(0),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | inactive
});

export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  name: jsonb("name").$type<Localized>().notNull(),
  order: integer("order").default(0),
});

export const establishments = pgTable("establishments", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull(),
  categoryId: integer("category_id").notNull(),
  subcategory: varchar("subcategory", { length: 64 }).notNull(),
  // Lets a listing belong to several of its category's subcategories at once
  // (e.g. a car rental agency offering both "4x4/SUV" and "Utilitaires") —
  // `subcategory` above stays the single primary one (used for filtering/
  // display everywhere that predates this), this is additive and only
  // populated/shown for categories whose form opts into multi-select.
  subcategories: jsonb("subcategories").$type<string[]>().default([]),
  // Optional indicative average price per day (MAD) — gives a browsing client
  // a budget idea before opening the fiche. Only meaningful for categories
  // priced by the day (car rental to start); null everywhere else.
  avgDailyPriceMad: integer("avg_daily_price_mad"),
  slug: varchar("slug", { length: 160 }).notNull(),
  name: jsonb("name").$type<Localized>().notNull(),
  description: jsonb("description").$type<Localized>().notNull(),
  address: varchar("address", { length: 255 }),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  phone: varchar("phone", { length: 64 }),
  whatsapp: varchar("whatsapp", { length: 64 }),
  website: varchar("website", { length: 255 }),
  instagram: varchar("instagram", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  // Links out to the merchant's existing profiles on trusted review
  // platforms — shown alongside our own on-site reviews, not fetched
  // via API (no scraping/ToS issues, no extra cost).
  googleReviewsUrl: varchar("google_reviews_url", { length: 255 }),
  tripadvisorUrl: varchar("tripadvisor_url", { length: 255 }),
  hours: jsonb("hours").$type<Localized>(),
  // Optional single closure window (e.g. annual vacation) — while today falls
  // within [vacationStart, vacationEnd], the public listing shows a closed banner.
  vacationStart: date("vacation_start"),
  vacationEnd: date("vacation_end"),
  priceLevel: varchar("price_level", { length: 8 }), // €, €€, €€€
  // Free-form tags for other activities offered on-site (e.g. a hotel that also
  // has a restaurant, a shop, a hammam) — an establishment keeps a single primary
  // category/subcategory for its URL and listing pages, these are just labels
  // shown on its own page, translated like other list content.
  services: jsonb("services").$type<LocalizedList>(),
  // Merchant-editable product/service list — name is translated like other
  // content, price is optional (MAD, whole units) since not every listing
  // (e.g. a boutique with variable pricing) wants to publish fixed prices.
  // category groups items on the public page (e.g. Entrées/Plats/Desserts)
  // and is null for items with no detected/entered grouping.
  products: jsonb("products").$type<{ name: Localized; price: number | null; category: Localized | null }[]>().default([]),
  // Set true automatically at creation for every establishment (see
  // pro-actions.ts applyAsProfessional / admin-actions.ts upsertEstablishment)
  // — an admin can still disable/re-enable it any time from the establishment's
  // admin page. digitalMenu is the QR-scanned menu's content, translated into
  // every site locale like other establishment text.
  menuTranslationEnabled: boolean("menu_translation_enabled").default(false),
  digitalMenu: jsonb("digital_menu").$type<import("@/lib/menu-types").DigitalMenuItem[]>().default([]),
  // Deliberately separate from `images` (the fiche's photo gallery) — the pro
  // may want a different, more "menu-branding" photo (a logo, a plated dish)
  // on the QR poster/menu page than whatever leads their public listing photos.
  menuPhoto: varchar("menu_photo", { length: 255 }),
  // Wide cover image shown behind the header on the public menu page only
  // (not printed on the poster, which stays a simple centered layout for print).
  menuBanner: varchar("menu_banner", { length: 255 }),
  parking: boolean("parking").default(false),
  wifi: boolean("wifi").default(false),
  accessibility: boolean("accessibility").default(false),
  pool: boolean("pool").default(false),
  airConditioning: boolean("air_conditioning").default(false),
  petsAllowed: boolean("pets_allowed").default(false),
  ourReview: jsonb("our_review").$type<Localized>(),
  faq: jsonb("faq").$type<{ q: Localized; a: Localized }[]>(),
  images: jsonb("images").$type<string[]>().default([]),
  featured: boolean("featured").default(false),
  badge: varchar("badge", { length: 64 }),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | disabled
  professionalId: integer("professional_id"),
  labelStatus: varchar("label_status", { length: 16 }).notNull().default("none"), // none | approved | suspended | revoked
  labelScore: integer("label_score"), // latest evaluation score, /100
  labelAwardedAt: timestamp("label_awarded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.cityId, table.slug),
]);

export const contentPages = pgTable("content_pages", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull(),
  section: varchar("section", { length: 32 }).notNull(), // matches a site_sections.slug, or "assistance-guides"
  slug: varchar("slug", { length: 160 }).notNull(),
  title: jsonb("title").$type<Localized>().notNull(),
  body: jsonb("body").$type<Localized>().notNull(),
  coverImage: varchar("cover_image", { length: 255 }),
  order: integer("order").default(0),
  // Optional price list (e.g. taxi fares by time of day); category groups rows
  // (e.g. Jour/Nuit) the same way establishment products are grouped.
  prices: jsonb("prices").$type<{ name: Localized; price: number | null; category: Localized | null }[]>().default([]),
  mapEnabled: boolean("map_enabled").default(false),
  mapPoints: jsonb("map_points").$type<{ label: string; lat: number; lng: number }[]>().default([]),
}, (table) => [
  unique().on(table.cityId, table.slug),
]);

// Admin-created custom sections that behave like Découvrir/Vivre à Essaouira:
// each gets its own top-level nav link (in the "Vivre à Essaouira" dropdown,
// alongside Blog/Agenda) and listing/detail pages, backed by content_pages
// rows whose "section" matches this slug.
export const siteSections = pgTable("site_sections", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: jsonb("name").$type<Localized>().notNull(),
  order: integer("order").default(0),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  locale: varchar("locale", { length: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---- Accounts, subscriptions & marketplace (Phase 2/3) ----

export const professionals = pgTable("professionals", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull(),
  clerkUserId: varchar("clerk_user_id", { length: 64 }).notNull().unique(),
  companyName: varchar("company_name", { length: 160 }).notNull(),
  contactName: varchar("contact_name", { length: 160 }),
  activityType: varchar("activity_type", { length: 32 }).notNull(), // restaurant|hotel|riad|activite|immobilier|boutique|artisan|service
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending|validated|refused|suspended
  createdAt: timestamp("created_at").defaultNow(),
  // Audit trail for the CGU Pro / Politique de Confidentialité acceptance
  // checkbox on the application form — kept separate from createdAt so it
  // stays meaningful if the signup flow ever adds steps between account
  // creation and the actual terms acceptance.
  termsAcceptedAt: timestamp("terms_accepted_at"),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 32 }).notNull().unique(), // starter|premium|business|enterprise
  name: jsonb("name").$type<Localized>().notNull(),
  priceMonthlyMad: integer("price_monthly_mad").notNull(),
  priceYearlyMad: integer("price_yearly_mad").notNull(), // discounted annual price (2 months free)
  maxPhotos: integer("max_photos"),
  features: jsonb("features").$type<LocalizedList>(),
  order: integer("order").default(0),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull(),
  planKey: varchar("plan_key", { length: 32 }).notNull(),
  billingCycle: varchar("billing_cycle", { length: 16 }).notNull().default("monthly"), // monthly|yearly
  status: varchar("status", { length: 16 }).notNull().default("active"), // active|trialing|past_due|canceled|manual
  paymentMethod: varchar("payment_method", { length: 24 }), // stripe|paypal|bank_transfer|manual
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 128 }),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id"),
  professionalId: integer("professional_id").notNull(),
  amountMad: integer("amount_mad").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // paid|pending|failed|refunded
  paymentMethod: varchar("payment_method", { length: 24 }),
  issuedAt: timestamp("issued_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const adCampaigns = pgTable("ad_campaigns", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id"),
  title: varchar("title", { length: 160 }).notNull(),
  placement: varchar("placement", { length: 32 }).notNull(), // home|search|category|newsletter
  campaignType: varchar("campaign_type", { length: 32 }).notNull(), // banniere|article_sponsorise|mise_en_avant|badge
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active|paused|ended
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").notNull(),
  clerkUserId: varchar("clerk_user_id", { length: 64 }),
  authorName: varchar("author_name", { length: 160 }).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending|approved|rejected
  ownerReply: text("owner_reply"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 64 }).notNull(),
  establishmentId: integer("establishment_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull(),
  serviceKey: varchar("service_key", { length: 32 }).notNull(), // shooting_photo|video|article_seo|social_media|ad_campaign|newsletter_feature|content_creation|marketing
  status: varchar("status", { length: 16 }).notNull().default("requested"), // requested|in_progress|done|cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 32 }).notNull().unique(),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active|inactive|maintenance
  // Nav-manageable builtin pages additionally use these two columns so an
  // admin can rename/reorder them in the flat nav without ever being able
  // to delete the underlying page.
  label: jsonb("label").$type<Localized | null>(),
  order: integer("order").default(0),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  // Null = the global wetravelgo.com landing page's branding. Otherwise the
  // settings for that one city (one row per city, enforced by the unique index).
  cityId: integer("city_id"),
  siteName: varchar("site_name", { length: 160 }).notNull().default("WeTravelGo"),
  logoUrl: varchar("logo_url", { length: 255 }),
  primaryColor: varchar("primary_color", { length: 16 }).default("#17495e"),
  secondaryColor: varchar("secondary_color", { length: 16 }).default("#bf6a45"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),
  contactEmail: varchar("contact_email", { length: 255 }),
  // Homepage hero background: 1 to 10 photo URLs, shown as a slow crossfade
  // slideshow. Empty means the plain bg-ocean-dark fallback is used instead.
  heroImages: jsonb("hero_images").$type<string[]>().default([]),
}, (table) => [
  unique().on(table.cityId),
]);

// Stormglass's free tier is a hard 10 requests/day, and Next's per-fetch
// revalidate cache resets on every deploy (this project redeploys often),
// so it alone isn't enough to stay under quota. This table is the durable
// cache: it survives deploys since it lives in Postgres, not the build.
export const tideCache = pgTable("tide_cache", {
  id: serial("id").primaryKey(),
  locationId: varchar("location_id", { length: 32 }).notNull().unique(),
  tides: jsonb("tides").$type<{ time: string; type: "high" | "low"; height: number }[]>().notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
});

// One row per completed menu-photo scan (the OCR step in MenuEditor) — powers
// a real, self-calibrating "temps restant" estimate for the next scan's
// progress bar instead of a fake timer: look at how long past scans with a
// similar photo count actually took.
export const menuScanDurations = pgTable("menu_scan_durations", {
  id: serial("id").primaryKey(),
  imageCount: integer("image_count").notNull(),
  durationMs: integer("duration_ms").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// One row per visit to an establishment's public digital menu page
// (src/app/menu/[slug]/page.tsx). Scanning the QR/poster is the main way
// visitors land there, but the establishment page and dashboard also link to
// it directly — there's no way to tell those apart server-side, so this
// counts all views of the page, which the admin stat calls "QR scans" as a
// close enough proxy for what the owner actually wants to know.
export const menuScans = pgTable("menu_scans", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
});

// ---- Assistance & Urgences ----
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull(),
  category: varchar("category", { length: 24 }).notNull(), // urgences|sante|securite|ambassade|depannage|argent|transport|telephone|info_utile
  name: jsonb("name").$type<Localized>().notNull(),
  phone: varchar("phone", { length: 64 }),
  whatsapp: varchar("whatsapp", { length: 64 }),
  address: varchar("address", { length: 255 }),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  hours: jsonb("hours").$type<Localized>(),
  notes: jsonb("notes").$type<Localized>(),
  website: varchar("website", { length: 255 }),
  country: varchar("country", { length: 100 }), // ambassades only
  featured: boolean("featured").default(false), // shown in the SOS quick panel
  order: integer("order").default(0),
});

// ---- "WeTravelGo Approved" label ----
export const labelEvaluations = pgTable("label_evaluations", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").notNull(),
  evaluatorClerkUserId: varchar("evaluator_clerk_user_id", { length: 64 }).notNull(),
  evaluatorName: varchar("evaluator_name", { length: 160 }),
  accueil: integer("accueil").notNull(),
  qualite: integer("qualite").notNull(),
  proprete: integer("proprete").notNull(),
  experience: integer("experience").notNull(),
  rapportQualitePrix: integer("rapport_qualite_prix").notNull(),
  authenticite: integer("authenticite").notNull(),
  reputation: integer("reputation").notNull(),
  presentation: integer("presentation").notNull(),
  services: integer("services").notNull(),
  impressionGenerale: integer("impression_generale").notNull(),
  totalScore: integer("total_score").notNull(), // sum of the 10 criteria, /100
  comments: text("comments"),
  decision: varchar("decision", { length: 16 }), // approved | refused | suspended | revoked
  createdAt: timestamp("created_at").defaultNow(),
});

// One row per calendar year the label was held — powers the public multi-year
// badge history (e.g. "Approved 2026 ✓, Approved 2027 ✓").
export const labelBadges = pgTable("label_badges", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").notNull(),
  year: integer("year").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | revoked
  evaluationId: integer("evaluation_id"),
  certificateNumber: varchar("certificate_number", { length: 32 }),
  awardedAt: timestamp("awarded_at").defaultNow(),
});

// Professional-submitted candidacy for the label — intake queue ahead of the
// editorial evaluation (label_evaluations).
export const labelApplications = pgTable("label_applications", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull(),
  establishmentId: integer("establishment_id").notNull(),
  contactName: varchar("contact_name", { length: 160 }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 255 }),
  address: varchar("address", { length: 255 }),
  website: varchar("website", { length: 255 }),
  socialLinks: varchar("social_links", { length: 255 }),
  activityDescription: text("activity_description"),
  images: jsonb("images").$type<string[]>().default([]),
  motivation: text("motivation"),
  charterAccepted: boolean("charter_accepted").notNull().default(false),
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  // pending | info_requested | visit_scheduled | on_hold | approved | refused
  createdAt: timestamp("created_at").defaultNow(),
});
