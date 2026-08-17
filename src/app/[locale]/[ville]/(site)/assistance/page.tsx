import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEmergencyContacts, getContentPages, getCityBySlug } from "@/lib/data";
import { isModuleActive } from "@/lib/modules";
import { Section } from "@/components/section";
import { MapSection } from "@/components/map-section";
import { HoursDisplay } from "@/components/hours-display";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetravelgo.com";

const CATEGORY_ORDER = [
  "urgences",
  "sante",
  "securite",
  "ambassade",
  "depannage",
  "argent",
  "transport",
  "telephone",
  "info_utile",
] as const;

// Cached and reused for every visitor for up to 1h instead of hitting the DB on
// every request — admin saves still show up immediately via revalidatePath.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ville: string }>;
}): Promise<Metadata> {
  const { locale, ville } = await params;
  const t = await getTranslations({ locale, namespace: "assistance" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: `${SITE_URL}/${locale}/${ville}/assistance` },
  };
}

export default async function AssistancePage({
  params,
}: {
  params: Promise<{ locale: string; ville: string }>;
}) {
  const { locale, ville } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(ville);
  if (!city || city.status !== "active") notFound();

  if (!(await isModuleActive("assistance"))) notFound();

  const [t, tDash, tEst, contacts, guides] = await Promise.all([
    getTranslations("assistance"),
    getTranslations("dashboard"),
    getTranslations("establishment"),
    getEmergencyContacts(city.id),
    getContentPages("assistance-guides", city.id),
  ]);

  const byCategory = new Map<string, typeof contacts>();
  for (const c of contacts) {
    if (!byCategory.has(c.category)) byCategory.set(c.category, []);
    byCategory.get(c.category)!.push(c);
  }

  const mapPoints = contacts
    .filter((c) => c.lat && c.lng)
    .map((c) => ({ lat: c.lat as number, lng: c.lng as number, label: c.name[locale] ?? c.name.fr }));

  return (
    <div>
      <div className="bg-red-600 py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
          <p className="mt-2 text-white/90">{t("subtitle")}</p>
        </div>
      </div>

      {guides.length > 0 && (
        <Section title={t("guides")}>
          <p className="-mt-6 mb-6 text-sm text-foreground/60">{t("guidesSubtitle")}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/${locale}/${ville}/assistance/${g.slug}`}
                className="rounded-xl border border-black/5 bg-white p-4 text-sm font-medium text-ocean-dark shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {g.title[locale] ?? g.title.fr}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {mapPoints.length > 0 && (
        <Section title={t("mapTitle")} className="pt-0">
          <div className="h-80 overflow-hidden rounded-2xl border border-black/5">
            <MapSection points={mapPoints} zoom={13} />
          </div>
        </Section>
      )}

      {CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => (
        <Section key={cat} title={t(`categories.${cat}`)} className="pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byCategory.get(cat)!.map((c) => (
              <div key={c.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="font-semibold text-ocean-dark">{c.name[locale] ?? c.name.fr}</p>
                {c.country && <p className="text-xs text-foreground/50">{c.country}</p>}
                {c.address && (
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-foreground/60">
                    <MapPin size={14} className="mt-0.5 shrink-0" /> {c.address}
                  </p>
                )}
                {c.hours && (c.hours[locale] ?? c.hours.fr) && (
                  <div className="mt-1 text-xs text-foreground/50">
                    <HoursDisplay
                      value={c.hours[locale] ?? c.hours.fr}
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
                      todayLabel={tEst("today")}
                    />
                  </div>
                )}
                {c.notes && (c.notes[locale] ?? c.notes.fr) && (
                  <p className="mt-2 text-xs text-amber-700">{c.notes[locale] ?? c.notes.fr}</p>
                )}
                <div className="mt-3 flex gap-2">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-1.5 rounded-full bg-ocean-dark px-3 py-1.5 text-xs font-semibold text-white hover:bg-ocean"
                    >
                      <Phone size={13} /> {t("call")}
                    </a>
                  )}
                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:bg-sand/40"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
