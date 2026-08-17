import Link from "next/link";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPinned } from "lucide-react";
import { notFound } from "next/navigation";
import {
  getCategories,
  getEstablishments,
  getSiteSectionBySlug,
  getContentPages,
  getCityBySlug,
} from "@/lib/data";
import { getCategoryIcon } from "@/lib/category-icons";
import { getActiveModuleKeys } from "@/lib/modules";
import { getSiteSettings } from "@/lib/admin-data";
import { Section } from "@/components/section";
import { SearchBar } from "@/components/search-bar";
import { NewsletterForm } from "@/components/newsletter-form";
import { MapSection } from "@/components/map-section";
import { HeroCarousel } from "@/components/hero-carousel";

// Cached and reused for every visitor for up to 1h instead of hitting the DB on
// every request — admin saves still show up immediately via revalidatePath.
export const revalidate = 3600;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string; ville: string }>;
}) {
  const { locale, ville } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(ville);
  if (!city || city.status !== "active") notFound();

  const [t, categoriesAll, establishmentsAll, activeModules, siteSettings, discoverSection, discoverPagesAll] =
    await Promise.all([
      getTranslations("home"),
      getCategories(),
      getEstablishments({ cityId: city.id, limit: 12 }),
      getActiveModuleKeys(),
      getSiteSettings(city.id),
      getSiteSectionBySlug("decouvrir"),
      getContentPages("decouvrir", city.id),
    ]);
  const discoverPages = discoverPagesAll.slice(0, 6);
  const heroImages = siteSettings?.heroImages ?? [];

  const categories = categoriesAll.filter((c) => c.status === "active");
  const categoryById = new Map(categoriesAll.map((c) => [c.id, c]));
  const establishments = establishmentsAll
    .filter((e) => {
      const cat = categoryById.get(e.categoryId);
      return cat && cat.status === "active";
    })
    .slice(0, 6);
  const mapPoints = establishments
    .filter((e) => e.lat && e.lng)
    .map((e) => {
      const cat = categoryById.get(e.categoryId);
      const path = cat ? cat.slug : "";
      return {
        lat: e.lat as number,
        lng: e.lng as number,
        label: e.name[locale] ?? e.name.fr,
        href: `/${locale}/${ville}/${path}/${e.slug}`,
      };
    });
  const newsletterActive = activeModules.has("newsletter");

  return (
    <div>
      <section className="relative overflow-hidden bg-ocean-dark text-white">
        {heroImages.length > 0 && <HeroCarousel images={heroImages} />}
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 lg:py-32">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-xl text-lg text-white/80">{t("heroSubtitle")}</p>
          <SearchBar />
        </div>
      </section>

      <Section title={t("categories")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            return (
              <Link
                key={c.id}
                href={`/${locale}/${ville}/${c.slug}`}
                className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white p-6 text-center sm:transition-colors sm:hover:border-ocean-dark/30"
              >
                <span className="text-ocean-dark"><Icon size={26} /></span>
                <span className="text-sm font-semibold text-ocean-dark">{c.name[locale] ?? c.name.fr}</span>
              </Link>
            );
          })}
        </div>
      </Section>

      {discoverSection && discoverPages.length > 0 && (
        <Section
          title={discoverSection.name[locale] ?? discoverSection.name.fr}
          action={
            <Link href={`/${locale}/${ville}/decouvrir`} className="text-sm font-semibold text-azur hover:underline">
              {t("viewAll")}
            </Link>
          }
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {discoverPages.map((p) => (
              <Link
                key={p.slug}
                href={`/${locale}/decouvrir/${p.slug}`}
                className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand">
                  {p.coverImage && (
                    <Image
                      src={p.coverImage}
                      alt={p.title[locale] ?? p.title.fr}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-ocean-dark">{p.title[locale] ?? p.title.fr}</h3>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section className="bg-sand/40 max-w-none px-0 py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <MapPinned size={32} className="text-ocean-dark" />
              <div>
                <h2 className="text-2xl font-semibold text-ocean-dark">{t("mapTitle")}</h2>
                <p className="text-sm text-foreground/60">{t("mapSubtitle")}</p>
              </div>
            </div>
            <Link
              href={`/${locale}/recherche`}
              className="rounded-full bg-ocean-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-ocean"
            >
              {t("mapCta")}
            </Link>
          </div>
          {mapPoints.length > 0 && (
            <div className="h-72 overflow-hidden rounded-2xl border border-black/5 shadow-sm sm:h-96">
              <MapSection points={mapPoints} zoom={13} />
            </div>
          )}
        </div>
      </Section>

      {newsletterActive && (
        <section className="bg-ocean-dark py-16 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{t("newsletterTitle")}</h2>
              <p className="mt-2 text-white/70">{t("newsletterSubtitle")}</p>
            </div>
            <NewsletterForm />
          </div>
        </section>
      )}
    </div>
  );
}
