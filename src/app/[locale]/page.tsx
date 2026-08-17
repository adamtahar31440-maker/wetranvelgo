import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import { getActiveCities } from "@/lib/data";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetravelgo.com";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "WeTravelGo",
    description: "Découvrez, préparez et vivez chaque ville avec WeTravelGo.",
    alternates: { canonical: `${SITE_URL}/${locale}` },
  };
}

// Not localized yet — this is the very first version of the multi-city landing
// page, French-only like the rest of the still-testing-phase site. Give it real
// next-intl strings once the copy is settled.
export default async function CityPickerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cities = await getActiveCities();

  return (
    <div className="flex min-h-full flex-col bg-ocean-dark text-white">
      <header className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <span className="text-lg font-semibold tracking-tight text-white">WeTravelGo</span>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
        <div>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Choisissez votre destination
          </h1>
          <p className="mt-3 max-w-xl text-white/70">
            Une plateforme, plusieurs villes marocaines à découvrir, préparer et vivre.
          </p>
        </div>

        {cities.length === 0 ? (
          <p className="text-white/70">Aucune ville n&apos;est encore disponible.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/${locale}/${city.slug}`}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-0.5 hover:border-white/30"
              >
                {city.heroImage && (
                  <Image
                    src={city.heroImage}
                    alt={city.name[locale] ?? city.name.fr}
                    fill
                    className="object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <MapPin size={18} className="text-terracotta" />
                  <span className="text-xl font-semibold">{city.name[locale] ?? city.name.fr}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 py-8 text-xs text-white/50 sm:px-6">
        © {new Date().getFullYear()} WeTravelGo
      </footer>
    </div>
  );
}
