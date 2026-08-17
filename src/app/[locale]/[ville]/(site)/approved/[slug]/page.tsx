import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Download } from "lucide-react";
import { getEstablishmentBySlug, getCityBySlug } from "@/lib/data";
import { getLabelBadges, getLabelEvaluationById } from "@/lib/admin-data";
import { LabelBadgeHistory } from "@/components/label-badge-history";

// Cached and reused for every visitor for up to 1h instead of hitting the DB on
// every request — admin saves still show up immediately via revalidatePath.
export const revalidate = 3600;

// The [slug] segment needs its own generateStaticParams to be registered for
// ISR at all, even an empty one — without it Next.js falls back to fully
// dynamic rendering regardless of `revalidate`. Returning [] means nothing is
// built upfront, but the first visit to any certificate renders once and is
// then cached until the next revalidation window.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ville: string; slug: string }>;
}): Promise<Metadata> {
  const { ville, slug } = await params;
  const city = await getCityBySlug(ville);
  if (!city) return {};
  const e = await getEstablishmentBySlug(slug, city.id);
  if (!e) return {};
  return {
    title: `${e.name.fr} — Essaouira Inside Approved`,
    description: `Certificat officiel du label Essaouira Inside Approved pour ${e.name.fr}.`,
  };
}

export default async function ApprovedPage({
  params,
}: {
  params: Promise<{ locale: string; ville: string; slug: string }>;
}) {
  const { locale, ville, slug } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(ville);
  if (!city || city.status !== "active") notFound();

  const e = await getEstablishmentBySlug(slug, city.id);
  if (!e) notFound();

  const badges = await getLabelBadges(e.id);
  if (badges.length === 0) notFound();

  const sorted = [...badges].sort((a, b) => b.year - a.year);
  const latest = sorted[0];
  const isActive = latest.status === "active";
  const evaluation = latest.evaluationId ? await getLabelEvaluationById(latest.evaluationId) : null;

  const name = e.name[locale] ?? e.name.fr;
  const description = e.description[locale] ?? e.description.fr;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="text-6xl">🏆</div>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-terracotta">
          Essaouira Inside Approved
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-ocean-dark sm:text-4xl">{name}</h1>

        <span
          className={`mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isActive ? `Label actif — ${latest.year}` : "Label non actif"}
        </span>
      </div>

      {e.images?.[0] && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-sand">
          <Image src={e.images[0]} alt={name} fill className="object-cover" priority sizes="100vw" />
        </div>
      )}

      <p className="mt-8 whitespace-pre-line leading-relaxed text-foreground/80">{description}</p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {evaluation && (
          <div className="rounded-2xl border border-black/5 bg-sand/30 p-5">
            <p className="text-xs font-semibold uppercase text-foreground/50">Score obtenu</p>
            <p className="mt-1 text-2xl font-bold text-ocean-dark">{evaluation.totalScore}/100</p>
          </div>
        )}
        <div className="rounded-2xl border border-black/5 bg-sand/30 p-5">
          <p className="text-xs font-semibold uppercase text-foreground/50">Date d&apos;attribution</p>
          <p className="mt-1 text-2xl font-bold text-ocean-dark">
            {latest.awardedAt ? new Date(latest.awardedAt).toLocaleDateString("fr-FR") : "—"}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-ocean-dark">Historique du label</h2>
        <LabelBadgeHistory badges={badges} />
      </div>

      {isActive && (
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={`/api/label/certificate/${e.id}?year=${latest.year}`}
            download
            className="flex items-center gap-2 rounded-full bg-ocean-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-ocean"
          >
            <Download size={16} /> Télécharger le certificat
          </a>
          <a
            href={`/api/label/badge/${e.id}?year=${latest.year}`}
            download
            className="flex items-center gap-2 rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-sand/40"
          >
            <Download size={16} /> Télécharger le badge
          </a>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-foreground/50">
        N° {latest.certificateNumber ?? `EIA-${latest.year}-${String(e.id).padStart(4, "0")}`} — Label indépendant,
        non achetable, attribué selon la charte officielle Essaouira Inside Approved.
      </p>
    </div>
  );
}
