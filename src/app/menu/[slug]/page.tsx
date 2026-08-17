import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { waitUntil } from "@vercel/functions";
import { getEstablishmentBySlug } from "@/lib/data";
import { getAllCategories } from "@/lib/admin-data";
import { qrFeatureLabel } from "@/lib/qr-feature-label";
import { recordMenuScan } from "@/lib/menu-scans";
import { routing } from "@/i18n/routing";
import { DigitalMenuView } from "@/components/digital-menu-view";
import frMessages from "../../../../messages/fr.json";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";
import esMessages from "../../../../messages/es.json";
import deMessages from "../../../../messages/de.json";
import itMessages from "../../../../messages/it.json";
import ptMessages from "../../../../messages/pt.json";
import ruMessages from "../../../../messages/ru.json";
import zhMessages from "../../../../messages/zh.json";
import koMessages from "../../../../messages/ko.json";
import trMessages from "../../../../messages/tr.json";
import heMessages from "../../../../messages/he.json";

// This route lives outside next-intl's [locale] segment on purpose (see the
// layout in this folder) — the language shown is picked per-visitor, not baked
// into the printed QR code, so it can't be a route param. Its handful of chrome
// strings are still sourced from the same messages/*.json files as the rest of
// the site rather than a separate dictionary, just read directly by locale code.
const MENU_PAGE_MESSAGES: Record<
  string,
  { allCategories: string; noItems: string; poweredBy: string; viewEstablishment: string }
> = {
  fr: frMessages.menuPage,
  en: enMessages.menuPage,
  ar: arMessages.menuPage,
  es: esMessages.menuPage,
  de: deMessages.menuPage,
  it: itMessages.menuPage,
  pt: ptMessages.menuPage,
  ru: ruMessages.menuPage,
  zh: zhMessages.menuPage,
  ko: koMessages.menuPage,
  tr: trMessages.menuPage,
  he: heMessages.menuPage,
};

function detectLocale(acceptLanguage: string | null, preferred: string | null): string {
  if (preferred && routing.locales.includes(preferred as (typeof routing.locales)[number])) return preferred;
  if (acceptLanguage) {
    const tags = acceptLanguage.split(",").map((t) => t.trim().split(";")[0].split("-")[0].toLowerCase());
    for (const tag of tags) {
      if (routing.locales.includes(tag as (typeof routing.locales)[number])) return tag;
    }
  }
  return routing.defaultLocale;
}

async function loadEstablishment(slug: string) {
  const establishment = await getEstablishmentBySlug(slug);
  if (!establishment || !establishment.menuTranslationEnabled) return null;
  if ((establishment.digitalMenu?.length ?? 0) === 0) return null;
  return establishment;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const establishment = await loadEstablishment(slug);
  if (!establishment) return {};
  const categories = await getAllCategories();
  const category = categories.find((c) => c.id === establishment.categoryId);
  const label = qrFeatureLabel(category?.type, "fr");
  return {
    title: `${establishment.name.fr} — ${label}`,
    description: `${label} de ${establishment.name.fr}, disponible en plusieurs langues — Essaouira Inside.`,
  };
}

export default async function DigitalMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const establishment = await loadEstablishment(slug);
  if (!establishment) notFound();

  // Fire-and-forget: never let logging a view slow down or break the menu itself.
  waitUntil(recordMenuScan(establishment.id));

  const headersList = await headers();
  const initialLocale = detectLocale(headersList.get("accept-language"), lang ?? null);

  const items = establishment.digitalMenu ?? [];
  const availableLocales = routing.locales.filter(
    (code) => code === "fr" || items.some((it) => !!it.name[code])
  );

  const categories = await getAllCategories();
  const category = categories.find((c) => c.id === establishment.categoryId);

  return (
    <DigitalMenuView
      establishmentName={establishment.name}
      logoUrl={establishment.menuPhoto}
      bannerUrl={establishment.menuBanner}
      items={items}
      initialLocale={initialLocale}
      availableLocales={availableLocales}
      chrome={MENU_PAGE_MESSAGES[initialLocale] ?? MENU_PAGE_MESSAGES.fr}
      establishmentSlug={establishment.slug}
      categorySlug={category?.slug}
      categoryType={category?.type}
    />
  );
}
