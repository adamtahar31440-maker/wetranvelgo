import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getContentPageBySlug, getCityBySlug } from "@/lib/data";
import { isModuleActive } from "@/lib/modules";
import { ContentDetail } from "@/components/content-detail";
import { stripHtml } from "@/lib/html";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetravelgo.com";

// Cached and reused for every visitor for up to 1h instead of hitting the DB on
// every request — admin saves still show up immediately via revalidatePath.
export const revalidate = 3600;

// The [slug] segment needs its own generateStaticParams to be registered for
// ISR at all, even an empty one — without it Next.js falls back to fully
// dynamic rendering regardless of `revalidate`. Returning [] means nothing is
// built upfront, but the first visit to any guide renders once and is then
// cached until the next revalidation window.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ville: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, ville, slug } = await params;
  const city = await getCityBySlug(ville);
  if (!city) return {};
  const page = await getContentPageBySlug("assistance-guides", slug, city.id);
  if (!page) return {};
  const title = page.title[locale] ?? page.title.fr;
  return {
    title,
    description: stripHtml(page.body[locale] ?? page.body.fr).slice(0, 155),
    alternates: { canonical: `${SITE_URL}/${locale}/${ville}/assistance/${slug}` },
  };
}

export default async function AssistanceGuidePage({
  params,
}: {
  params: Promise<{ locale: string; ville: string; slug: string }>;
}) {
  const { locale, ville, slug } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(ville);
  if (!city || city.status !== "active") notFound();

  if (!(await isModuleActive("assistance"))) notFound();

  const page = await getContentPageBySlug("assistance-guides", slug, city.id);
  if (!page) notFound();

  const t = await getTranslations("common");

  const priceGroups = (page.prices ?? []).reduce<{ category: string | null; items: { name: string; price: number | null }[] }[]>(
    (groups, p) => {
      const categoryLabel = p.category ? p.category[locale] ?? p.category.fr : null;
      const item = { name: p.name[locale] ?? p.name.fr, price: p.price };
      const existing = groups.find((g) => g.category === categoryLabel);
      if (existing) existing.items.push(item);
      else groups.push({ category: categoryLabel, items: [item] });
      return groups;
    },
    []
  );

  return (
    <ContentDetail
      locale={locale}
      backHref={`/${locale}/${ville}/assistance`}
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
