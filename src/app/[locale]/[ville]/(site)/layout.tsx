import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SosButton } from "@/components/sos-button";
import { WeatherWidget } from "@/components/weather-widget";
import { getActiveModuleKeys } from "@/lib/modules";
import { getFeaturedEmergencyContacts, getCityBySlug, getActiveCities } from "@/lib/data";
import { getSiteSettings } from "@/lib/admin-data";
import { getNavItems } from "@/lib/nav";
import { getTranslations } from "next-intl/server";

// Registers the [ville] segment for ISR — without it every city page falls
// back to fully dynamic rendering (see the same pattern used for [category]).
export async function generateStaticParams() {
  const cities = await getActiveCities();
  return cities.map((c) => ({ ville: c.slug }));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; ville: string }>;
}) {
  const { locale, ville } = await params;

  const city = await getCityBySlug(ville);
  if (!city || city.status !== "active") notFound();

  const [activeModules, sosContacts, navItems, tNav, siteSettings] = await Promise.all([
    getActiveModuleKeys(),
    getFeaturedEmergencyContacts(city.id),
    getNavItems(),
    getTranslations({ locale, namespace: "nav" }),
    getSiteSettings(city.id),
  ]);
  const siteName = siteSettings?.siteName ?? "WeTravelGo";
  const cityLabel = city.name[locale] ?? city.name.fr;

  const activeItems = navItems.filter((item) => item.active);
  const labelFor = (item: (typeof activeItems)[number]) =>
    item.label?.[locale] ?? item.label?.fr ?? (item.i18nKey ? tNav(item.i18nKey as never) : item.key);
  const toNavLink = (item: (typeof activeItems)[number]) => ({
    href: item.href,
    label: labelFor(item),
    pages: item.pages?.map((p) => ({
      href: `${item.href}/${p.slug}`,
      label: p.label[locale] ?? p.label.fr,
    })),
  });

  // Footer lists every link flat, categories included, so they stay easy to find.
  const footerNavLinks = activeItems.map(toNavLink);

  // Header collapses all "category" items (Restaurants, Hébergements, ...) into
  // one "Professionnels" dropdown so the bar doesn't grow with every new category.
  const categoryItems = activeItems.filter((item) => item.type === "category");
  const headerNavLinks: ReturnType<typeof toNavLink>[] = [];
  let categoriesGrouped = false;
  for (const item of activeItems) {
    if (item.type === "category") {
      if (!categoriesGrouped) {
        headerNavLinks.push({
          href: "",
          label: tNav("professionals"),
          pages: categoryItems.map((c) => ({ href: c.href, label: labelFor(c) })),
        });
        categoriesGrouped = true;
      }
      continue;
    }
    headerNavLinks.push(toNavLink(item));
  }

  return (
    <>
      <Header ville={ville} siteName={siteName} navLinks={headerNavLinks} />
      <main className="flex-1">{children}</main>
      <Footer ville={ville} siteName={siteName} cityLabel={cityLabel} activeModules={Array.from(activeModules)} navLinks={footerNavLinks} />
      {activeModules.has("assistance") && sosContacts.length > 0 && <SosButton contacts={sosContacts} />}
      {(city.tideLocations?.length ?? 0) > 0 && <WeatherWidget locale={locale} />}
    </>
  );
}
