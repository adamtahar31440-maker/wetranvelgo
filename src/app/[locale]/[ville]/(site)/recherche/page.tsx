import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEstablishments, getCategories, getAllSubcategories, getCityBySlug } from "@/lib/data";
import { buildSubcategoryMap, subcategoryLabel, priceLevelLabel } from "@/lib/labels";
import { EstablishmentCard } from "@/components/establishment-card";
import { MapSection } from "@/components/map-section";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  return { title: t("title") };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; ville: string }>;
  searchParams: Promise<{ q?: string; type?: string; price?: string; sort?: string }>;
}) {
  const { locale, ville } = await params;
  const { q, type, price, sort } = await searchParams;
  setRequestLocale(locale);

  const city = await getCityBySlug(ville);
  if (!city || city.status !== "active") notFound();

  const [t, categories, all, allSubcategories] = await Promise.all([
    getTranslations("search"),
    getCategories(),
    getEstablishments({ cityId: city.id }),
    getAllSubcategories(),
  ]);
  const subcategoryMap = buildSubcategoryMap(allSubcategories);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  let results = all.filter((e) => {
    if (type) {
      const cat = categoryById.get(e.categoryId);
      if (cat?.type !== type) return false;
    }
    if (price && e.priceLevel !== price) return false;
    if (q) {
      const needle = q.toLowerCase();
      const haystack = [
        e.name.fr, e.name.en, e.name.ar,
        e.description.fr, e.description.en,
        e.address ?? "",
      ].join(" ").toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  if (sort === "name") {
    results = [...results].sort((a, b) =>
      (a.name[locale] ?? a.name.fr).localeCompare(b.name[locale] ?? b.name.fr)
    );
  } else {
    results = [...results].sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  const points = results
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

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q, type, price, sort, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return `/${locale}/${ville}/recherche${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="bg-sand/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-semibold text-ocean-dark sm:text-4xl">
            {q ? `${t("resultsFor")} "${q}"` : t("title")}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-ocean-dark">{t("category")}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={buildHref({ type: undefined })} className={cn("rounded-full border px-3 py-1 text-xs font-medium", !type ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10 text-foreground/70")}>
                {t("all")}
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={buildHref({ type: c.type })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    type === c.type ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10 text-foreground/70"
                  )}
                >
                  {c.name[locale] ?? c.name.fr}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ocean-dark">{t("priceLevel")}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={buildHref({ price: undefined })} className={cn("rounded-full border px-3 py-1 text-xs font-medium", !price ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10 text-foreground/70")}>
                {t("all")}
              </Link>
              {["€", "€€", "€€€"].map((p) => (
                <Link
                  key={p}
                  href={buildHref({ price: p })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    price === p ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10 text-foreground/70"
                  )}
                >
                  {priceLevelLabel(p)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ocean-dark">{t("sortBy")}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={buildHref({ sort: undefined })} className={cn("rounded-full border px-3 py-1 text-xs font-medium", !sort || sort !== "name" ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10 text-foreground/70")}>
                {t("sortFeatured")}
              </Link>
              <Link href={buildHref({ sort: "name" })} className={cn("rounded-full border px-3 py-1 text-xs font-medium", sort === "name" ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10 text-foreground/70")}>
                {t("sortNameAsc")}
              </Link>
            </div>
          </div>

          {points.length > 0 && (
            <div className="h-64 overflow-hidden rounded-2xl border border-black/5">
              <MapSection points={points} zoom={12} />
            </div>
          )}
        </aside>

        <div>
          {results.length === 0 ? (
            <p className="text-foreground/60">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((e) => {
                const cat = categoryById.get(e.categoryId);
                const path = cat ? cat.slug : "";
                return (
                  <EstablishmentCard
                    key={e.id}
                    href={`/${locale}/${ville}/${path}/${e.slug}`}
                    name={e.name[locale] ?? e.name.fr}
                    image={e.images?.[0]}
                    subcategory={subcategoryLabel(subcategoryMap, e.subcategory, locale)}
                    address={e.address}
                    priceLevel={e.priceLevel}
                    badge={e.badge}
                    wifi={e.wifi}
                    parking={e.parking}
                    avgDailyPriceMad={e.avgDailyPriceMad}
                    avgDailyPriceLabel={
                      e.avgDailyPriceMad != null
                        ? t("avgDailyPriceLabel").replace("{price}", String(e.avgDailyPriceMad))
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
