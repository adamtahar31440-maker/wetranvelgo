import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllEstablishments, getCategories, getActiveCities } from "@/lib/data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetravelgo.com";

const STATIC_PATHS = [
  "",
  "/recherche",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [establishments, categories, cities] = await Promise.all([
    getAllEstablishments(),
    getCategories(),
    getActiveCities(),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const establishmentsByCity = new Map<number, typeof establishments>();
  for (const e of establishments) {
    if (!establishmentsByCity.has(e.cityId)) establishmentsByCity.set(e.cityId, []);
    establishmentsByCity.get(e.cityId)!.push(e);
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    entries.push({ url: `${BASE_URL}/${locale}`, changeFrequency: "weekly" });

    for (const city of cities) {
      for (const path of STATIC_PATHS) {
        entries.push({ url: `${BASE_URL}/${locale}/${city.slug}${path}`, changeFrequency: "weekly" });
      }
      for (const c of categories) {
        entries.push({ url: `${BASE_URL}/${locale}/${city.slug}/${c.slug}`, changeFrequency: "weekly" });
      }
      for (const e of establishmentsByCity.get(city.id) ?? []) {
        const cat = categoryById.get(e.categoryId);
        const path = cat ? cat.slug : null;
        if (!path) continue;
        entries.push({ url: `${BASE_URL}/${locale}/${city.slug}/${path}/${e.slug}`, changeFrequency: "monthly" });
      }
    }
  }

  return entries;
}
