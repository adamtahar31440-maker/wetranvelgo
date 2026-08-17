import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildSubcategoryMap } from "@/lib/labels";
import {
  getEstablishments,
  getSiteSectionBySlug,
  getContentPages,
  getCategoryBySlug,
  getSubcategories,
  getCategories,
  getSiteSections,
  getCityBySlug,
  getActiveCities,
} from "@/lib/data";
import { Section } from "@/components/section";
import { ContentHub } from "@/components/content-hub";
import { CategoryEstablishments } from "@/components/category-establishments";

// Cached and reused for every visitor for up to 1h instead of hitting the DB on
// every request — admin saves still show up immediately via revalidatePath.
// The subcategory filter (`?sub=`) is handled client-side (see
// CategoryEstablishments) specifically so this page never has to read
// searchParams, which would otherwise force it out of ISR entirely.
export const revalidate = 3600;

// Nested dynamic segments need their own generateStaticParams to be registered
// for ISR at all — without it, Next.js falls back to fully dynamic rendering
// for this segment regardless of `revalidate` (only the [locale] segment above
// it would get cached). The actual category/section list is small and known.
export async function generateStaticParams() {
  const [categories, sections, cities] = await Promise.all([getCategories(), getSiteSections(), getActiveCities()]);
  const categorySlugs = [...categories.map((c) => c.slug), ...sections.map((s) => s.slug)];
  return cities.flatMap((city) => categorySlugs.map((category) => ({ ville: city.slug, category })));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetravelgo.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ville: string; category: string }>;
}): Promise<Metadata> {
  const { locale, ville, category } = await params;
  const city = await getCityBySlug(ville);
  if (!city) return {};
  const cityLabel = city.name[locale] ?? city.name.fr;
  const cat = await getCategoryBySlug(category);
  if (!cat) {
    const section = await getSiteSectionBySlug(category);
    if (!section) return {};
    const label = section.name[locale] ?? section.name.fr;
    return {
      title: label,
      alternates: { canonical: `${SITE_URL}/${locale}/${ville}/${category}` },
    };
  }
  const label = cat.name[locale] ?? cat.name.fr;
  return {
    title: label,
    description: `${label} à ${cityLabel}`,
    alternates: { canonical: `${SITE_URL}/${locale}/${ville}/${category}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; ville: string; category: string }>;
}) {
  const { locale, ville, category } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(ville);
  if (!city || city.status !== "active") notFound();

  const cat = await getCategoryBySlug(category);
  if (!cat) {
    const section = await getSiteSectionBySlug(category);
    if (!section) notFound();
    const pages = await getContentPages(category, city.id);
    return (
      <ContentHub
        locale={locale}
        basePath={`${ville}/${category}`}
        title={section.name[locale] ?? section.name.fr}
        pages={pages}
      />
    );
  }

  if (cat.status !== "active") notFound();

  const [t, establishments, subcategories] = await Promise.all([
    getTranslations("search"),
    getEstablishments({ type: cat.type, cityId: city.id }),
    getSubcategories(cat.id),
  ]);
  const subcategoryMap = buildSubcategoryMap(subcategories);

  return (
    <div>
      <div className="bg-sand/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-semibold text-ocean-dark sm:text-4xl">
            {cat.name[locale] ?? cat.name.fr}
          </h1>
        </div>
      </div>

      <Section>
        <Suspense>
          <CategoryEstablishments
            locale={locale}
            ville={ville}
            category={category}
            establishments={establishments}
            subcategories={subcategories}
            subcategoryMap={subcategoryMap}
            allLabel={t("all")}
            noResultsLabel={t("noResults")}
            avgDailyPriceTemplate={t("avgDailyPriceLabel")}
          />
        </Suspense>
      </Section>
    </div>
  );
}
