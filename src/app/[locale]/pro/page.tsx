import Link from "next/link";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Section } from "@/components/section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Espace Professionnel",
    description:
      "Rejoignez Essaouira Inside en tant que professionnel : restaurants, hôtels, riads, activités, agences immobilières. Inscription gratuite.",
    alternates: { canonical: `https://essaouirainside.com/${locale}/pro` },
  };
}

export default async function ProLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const dashboardPath = `/${locale}/pro/dashboard`;
  const signInHref = `/${locale}/sign-in?redirect_url=${encodeURIComponent(dashboardPath)}`;
  const signUpHref = `/${locale}/sign-up?redirect_url=${encodeURIComponent(dashboardPath)}`;

  return (
    <div>
      <div className="bg-ocean-dark py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-semibold sm:text-4xl">Rejoignez Essaouira Inside</h1>
          <p className="mt-4 text-white/80">
            Restaurants, hôtels, riads, activités, boutiques, agences immobilières — mettez votre établissement en
            avant auprès des voyageurs et habitants d&apos;Essaouira.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={signUpHref}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ocean-dark hover:bg-white/90"
            >
              Créer mon compte pro
            </Link>
            <Link
              href={signInHref}
              className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>

      <Section>
        <div className="mx-auto max-w-xl rounded-2xl border border-black/5 bg-white p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-azur">Offre de lancement</p>
          <p className="mt-2 text-3xl font-semibold text-ocean-dark">Gratuit</p>
          <p className="mt-3 text-sm text-foreground/70">
            Ajoutez votre établissement et gérez votre fiche (photos, horaires, produits, coordonnées) sans aucun
            frais.
          </p>
          <Link
            href={signUpHref}
            className="mt-6 inline-block rounded-full bg-ocean-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean"
          >
            Créer ma fiche gratuite
          </Link>
        </div>

        <p className="mt-10 text-center text-sm text-foreground/60">
          Après inscription, votre demande est validée par notre équipe sous 24-48h avant activation.
        </p>
      </Section>
    </div>
  );
}
