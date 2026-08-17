import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Phone,
  MessageCircle,
  Globe,
  MapPin,
  Wifi,
  Car,
  Accessibility,
  Star,
  ChevronRight,
  Link2,
  ExternalLink,
  Waves,
  Snowflake,
  PawPrint,
  QrCode,
} from "lucide-react";
import { buildSubcategoryMap, subcategoryLabel, priceLevelLabel } from "@/lib/labels";
import { qrFeatureLabel } from "@/lib/qr-feature-label";
import {
  getEstablishmentBySlug,
  getSimilarEstablishments,
  getSiteSectionBySlug,
  getContentPageBySlug,
  getCategoryBySlug,
  getSubcategories,
  getCityBySlug,
} from "@/lib/data";
import { getLabelBadges, getApprovedReviewsForEstablishment } from "@/lib/admin-data";
import { EstablishmentCard } from "@/components/establishment-card";
import { Section } from "@/components/section";
import { MapSection } from "@/components/map-section";
import { LabelBadgeHistory } from "@/components/label-badge-history";
import { DirectionsButton } from "@/components/directions-button";
import { PhotoGallery } from "@/components/photo-gallery";
import { HoursDisplay } from "@/components/hours-display";
import { ProductCategoryList } from "@/components/product-category-list";
import { ContentDetail } from "@/components/content-detail";
import { ClampedText } from "@/components/clamped-text";
import { stripHtml } from "@/lib/html";

// Cached and reused for every visitor for up to 1h instead of hitting the DB on
// every request — admin saves still show up immediately via revalidatePath.
export const revalidate = 3600;

// A nested dynamic segment (here two: [category] and [slug]) needs its own
// generateStaticParams to be registered for ISR at all, even an empty one —
// without it Next.js silently falls back to fully dynamic, per-request
// rendering regardless of `revalidate`. Returning [] means nothing is built
// upfront (hundreds of establishments/articles would slow the build a lot),
// but the first visit to any path renders once and gets cached from then on.
export async function generateStaticParams() {
  return [];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetravelgo.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ville: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, ville, category, slug } = await params;
  const city = await getCityBySlug(ville);
  if (!city) return {};
  const cat = await getCategoryBySlug(category);
  if (!cat) {
    const section = await getSiteSectionBySlug(category);
    if (!section) return {};
    const page = await getContentPageBySlug(category, slug, city.id);
    if (!page) return {};
    const title = page.title[locale] ?? page.title.fr;
    return {
      title,
      description: stripHtml(page.body[locale] ?? page.body.fr).slice(0, 155),
      alternates: { canonical: `${SITE_URL}/${locale}/${ville}/${category}/${slug}` },
    };
  }
  const e = await getEstablishmentBySlug(slug, city.id);
  if (!e) return {};
  const name = e.name[locale] ?? e.name.fr;
  const description = (e.description[locale] ?? e.description.fr).slice(0, 155);
  return {
    title: name,
    description,
    alternates: { canonical: `${SITE_URL}/${locale}/${ville}/${category}/${slug}` },
    openGraph: {
      title: name,
      description,
      images: e.images?.[0] ? [e.images[0]] : undefined,
    },
  };
}

export default async function EstablishmentPage({
  params,
}: {
  params: Promise<{ locale: string; ville: string; category: string; slug: string }>;
}) {
  const { locale, ville, category, slug } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(ville);
  if (!city || city.status !== "active") notFound();

  const cat = await getCategoryBySlug(category);
  if (!cat) {
    const section = await getSiteSectionBySlug(category);
    if (!section) notFound();
    const page = await getContentPageBySlug(category, slug, city.id);
    if (!page) notFound();

    const t = await getTranslations("common");
    const priceGroups = (page.prices ?? []).reduce<
      { category: string | null; items: { name: string; price: number | null }[] }[]
    >((groups, p) => {
      const categoryLabel = p.category ? p.category[locale] ?? p.category.fr : null;
      const item = { name: p.name[locale] ?? p.name.fr, price: p.price };
      const existing = groups.find((g) => g.category === categoryLabel);
      if (existing) existing.items.push(item);
      else groups.push({ category: categoryLabel, items: [item] });
      return groups;
    }, []);

    return (
      <ContentDetail
        locale={locale}
        backHref={`/${locale}/${ville}/${category}`}
        backLabel={t("back")}
        title={page.title[locale] ?? page.title.fr}
        body={page.body[locale] ?? page.body.fr}
        coverImage={page.coverImage}
        priceGroups={priceGroups}
        pricesTitle={t("pricesTitle")}
        mapPoints={page.mapEnabled ? page.mapPoints ?? [] : []}
        mapTitle={t("mapTitle")}
      />
    );
  }

  if (cat.status !== "active") notFound();

  const e = await getEstablishmentBySlug(slug, city.id);
  if (!e) notFound();

  const [t, tNav, tDash, similar, badges, reviews, subcategories] = await Promise.all([
    getTranslations("establishment"),
    getTranslations("nav"),
    getTranslations("dashboard"),
    getSimilarEstablishments(e.categoryId, city.id, e.slug),
    getLabelBadges(e.id),
    getApprovedReviewsForEstablishment(e.id),
    getSubcategories(cat.id),
  ]);
  const subcategoryMap = buildSubcategoryMap(subcategories);
  const activeBadges = badges.filter((b) => b.status === "active");
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  const name = e.name[locale] ?? e.name.fr;
  const description = e.description[locale] ?? e.description.fr;
  const images = e.images ?? [];
  const services = e.services?.[locale] ?? e.services?.fr ?? [];
  const products = e.products ?? [];
  const productGroups = products.reduce<{ category: string | null; items: typeof products }[]>((groups, p) => {
    const categoryLabel = p.category ? p.category[locale] ?? p.category.fr : null;
    const existing = groups.find((g) => g.category === categoryLabel);
    if (existing) existing.items.push(p);
    else groups.push({ category: categoryLabel, items: [p] });
    return groups;
  }, []);
  const today = new Date().toISOString().slice(0, 10);
  const isOnVacation = !!(e.vacationStart && e.vacationEnd && today >= e.vacationStart && today <= e.vacationEnd);
  const vacationMessage = isOnVacation
    ? t("closedForVacation", {
        start: new Date(e.vacationStart as string).toLocaleDateString(locale, { day: "numeric", month: "long" }),
        end: new Date(e.vacationEnd as string).toLocaleDateString(locale, { day: "numeric", month: "long" }),
      })
    : null;

  const review = e.ourReview?.[locale] ?? e.ourReview?.fr;
  const hours = e.hours?.[locale] ?? e.hours?.fr;
  const faq = e.faq ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    image: images,
    address: {
      "@type": "PostalAddress",
      streetAddress: e.address ?? undefined,
      addressLocality: city.name[locale] ?? city.name.fr,
      addressCountry: "MA",
    },
    telephone: e.phone ?? undefined,
    url: e.website ?? undefined,
    priceRange: e.priceLevel ? priceLevelLabel(e.priceLevel) : undefined,
    ...(e.lat && e.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lng } }
      : {}),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-foreground/50">
          <Link href={`/${locale}/${ville}`} className="hover:text-ocean-dark">{tNav("home")}</Link>
          <ChevronRight size={12} className="rtl:rotate-180" />
          <Link href={`/${locale}/${ville}/${category}`} className="hover:text-ocean-dark">
            {cat.name[locale] ?? cat.name.fr}
          </Link>
          <ChevronRight size={12} className="rtl:rotate-180" />
          <span className="truncate text-foreground/70">{name}</span>
        </nav>

        {vacationMessage && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {vacationMessage}
          </p>
        )}
      </div>

      {images.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <PhotoGallery images={images} name={name} moreLabel={t("morePhotos", { count: images.length - 6 })} />
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-azur">
            {subcategoryLabel(subcategoryMap, e.subcategory, locale)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-ocean-dark sm:text-4xl">{name}</h1>
          {e.subcategories && e.subcategories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {e.subcategories.map((slug) => (
                <span
                  key={slug}
                  className="rounded-full bg-sand/60 px-3 py-1 text-xs font-medium text-foreground/70"
                >
                  {subcategoryLabel(subcategoryMap, slug, locale)}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {avgRating !== null && (
              <a href="#reviews" className="flex items-center gap-1 text-sm font-semibold text-ocean-dark hover:underline">
                <Star size={16} className="fill-terracotta text-terracotta" />
                {avgRating.toFixed(1)}
                <span className="font-normal text-foreground/50">({reviews.length})</span>
              </a>
            )}
            {e.address && (
              <p className="flex items-center gap-1.5 text-foreground/60">
                <MapPin size={16} /> {e.address}
              </p>
            )}
          </div>

          {activeBadges.length > 0 && (
            <div className="mt-5">
              <LabelBadgeHistory badges={activeBadges} />
              <Link
                href={`/${locale}/${ville}/approved/${e.slug}`}
                className="mt-2 inline-block text-sm font-medium text-terracotta hover:underline"
              >
                {t("viewCertificate")} →
              </Link>
            </div>
          )}

          {hours && (
            <div className="mt-6 lg:hidden">
              <HoursDisplay
                value={hours}
                dayLabels={[
                  tDash("dayMon"),
                  tDash("dayTue"),
                  tDash("dayWed"),
                  tDash("dayThu"),
                  tDash("dayFri"),
                  tDash("daySat"),
                  tDash("daySun"),
                ]}
                closedLabel={tDash("hoursClosed")}
                todayLabel={t("today")}
              />
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-ocean-dark">{t("about")}</h2>
            <ClampedText
              text={description}
              moreLabel={t("showMore")}
              lessLabel={t("showLess")}
              className="mt-2 text-foreground/80"
            />
          </div>

          {review && (
            <div className="mt-8 rounded-2xl bg-sand/40 p-6">
              <h2 className="text-lg font-semibold text-ocean-dark">{t("ourReview")}</h2>
              <p className="mt-2 leading-relaxed text-foreground/80">{review}</p>
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-ocean-dark">{t("productsTitle")}</h2>
              <div className="mt-3">
                <ProductCategoryList
                  groups={productGroups.map((g) => ({
                    category: g.category,
                    items: g.items.map((p) => ({ name: p.name[locale] ?? p.name.fr, price: p.price })),
                  }))}
                />
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-ocean-dark">{t("services")}</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {services.map((s, i) => (
                  <li key={i} className="rounded-lg bg-sand/40 px-3 py-2 text-sm text-foreground/80">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-foreground/70">
            {e.wifi && <span className="flex items-center gap-1.5"><Wifi size={16} /> {t("wifi")}</span>}
            {e.parking && <span className="flex items-center gap-1.5"><Car size={16} /> {t("parking")}</span>}
            {e.pool && <span className="flex items-center gap-1.5"><Waves size={16} /> {t("pool")}</span>}
            {e.airConditioning && (
              <span className="flex items-center gap-1.5"><Snowflake size={16} /> {t("airConditioning")}</span>
            )}
            {e.accessibility && (
              <span className="flex items-center gap-1.5"><Accessibility size={16} /> {t("accessibility")}</span>
            )}
            {e.petsAllowed && (
              <span className="flex items-center gap-1.5"><PawPrint size={16} /> {t("petsAllowed")}</span>
            )}
          </div>

          {faq.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-ocean-dark">{t("faq")}</h2>
              <div className="mt-3 divide-y divide-black/5 rounded-2xl border border-black/5">
                {faq.map((item, i) => (
                  <details key={i} className="group p-4">
                    <summary className="cursor-pointer list-none font-medium text-foreground/80">
                      {item.q[locale] ?? item.q.fr}
                    </summary>
                    <p className="mt-2 text-sm text-foreground/60">{item.a[locale] ?? item.a.fr}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          <div id="reviews" className="mt-10 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ocean-dark">
              {t("reviewsTitle")}
              {avgRating !== null && (
                <span className="flex items-center gap-1 text-sm font-normal text-foreground/60">
                  <Star size={14} className="fill-terracotta text-terracotta" />
                  {avgRating.toFixed(1)} · {t("basedOnReviews", { count: reviews.length })}
                </span>
              )}
            </h2>

            {(e.instagram || e.facebook || e.googleReviewsUrl || e.tripadvisorUrl) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {e.instagram && (
                  <a
                    href={e.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/40"
                  >
                    <Link2 size={14} /> Instagram
                  </a>
                )}
                {e.facebook && (
                  <a
                    href={e.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/40"
                  >
                    <Link2 size={14} /> Facebook
                  </a>
                )}
                {e.googleReviewsUrl && (
                  <a
                    href={e.googleReviewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/40"
                  >
                    <ExternalLink size={14} /> {t("googleReviewsLabel")}
                  </a>
                )}
                {e.tripadvisorUrl && (
                  <a
                    href={e.tripadvisorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/40"
                  >
                    <ExternalLink size={14} /> {t("tripadvisorLabel")}
                  </a>
                )}
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-foreground/60">{t("noReviews")}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-black/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ocean-dark">{r.authorName}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < r.rating ? "fill-terracotta text-terracotta" : "text-black/15"}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="mt-2 text-sm leading-relaxed text-foreground/80">{r.comment}</p>}
                    {r.ownerReply && (
                      <div className="mt-3 rounded-xl bg-sand/40 p-3">
                        <p className="text-xs font-semibold text-ocean-dark">{name}</p>
                        <p className="mt-1 text-sm text-foreground/70">{r.ownerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {e.lat && e.lng && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-ocean-dark">{t("map")}</h2>
              <div className="mt-3 h-80 overflow-hidden rounded-2xl border border-black/5">
                <MapSection points={[{ lat: e.lat, lng: e.lng, label: name }]} />
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          {e.priceLevel && (
            <p className="text-sm font-semibold text-foreground/60">
              {t("price")}: <span className="text-ocean-dark">{priceLevelLabel(e.priceLevel)}</span>
            </p>
          )}
          {e.avgDailyPriceMad != null && (
            <p className="mt-1 text-lg font-semibold text-terracotta">
              {t("avgDailyPriceLabel").replace("{price}", String(e.avgDailyPriceMad))}
            </p>
          )}
          {hours && (
            <div className="mt-3 hidden lg:block">
              <HoursDisplay
                value={hours}
                dayLabels={[
                  tDash("dayMon"),
                  tDash("dayTue"),
                  tDash("dayWed"),
                  tDash("dayThu"),
                  tDash("dayFri"),
                  tDash("daySat"),
                  tDash("daySun"),
                ]}
                closedLabel={tDash("hoursClosed")}
                todayLabel={t("today")}
              />
            </div>
          )}
          <div className="mt-5 flex flex-col gap-2">
            {e.menuTranslationEnabled && (e.digitalMenu?.length ?? 0) > 0 && (
              <a
                href={`/menu/${e.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <QrCode size={16} /> {t("viewDigitalMenu").replace("{label}", qrFeatureLabel(cat?.type, locale))}
              </a>
            )}
            {e.phone && (
              <a
                href={`tel:${e.phone}`}
                className="flex items-center justify-center gap-2 rounded-full bg-ocean-dark px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean"
              >
                <Phone size={16} /> {e.phone}
              </a>
            )}
            {e.whatsapp && (
              <a
                href={`https://wa.me/${e.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-sand/40"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            {e.website && (
              <a
                href={e.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-sand/40"
              >
                <Globe size={16} /> {t("website")}
              </a>
            )}
            {e.lat && e.lng && (
              <DirectionsButton lat={e.lat} lng={e.lng} label={t("getDirections")} />
            )}
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <Section title={t("similar")}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <EstablishmentCard
                key={s.id}
                href={`/${locale}/${ville}/${category}/${s.slug}`}
                name={s.name[locale] ?? s.name.fr}
                image={s.images?.[0]}
                subcategory={subcategoryLabel(subcategoryMap, s.subcategory, locale)}
                address={s.address}
                priceLevel={s.priceLevel}
                badge={s.badge}
                avgDailyPriceMad={s.avgDailyPriceMad}
                avgDailyPriceLabel={
                  s.avgDailyPriceMad != null
                    ? t("avgDailyPriceLabel").replace("{price}", String(s.avgDailyPriceMad))
                    : undefined
                }
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
