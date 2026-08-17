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
    title: "Mentions légales",
    alternates: { canonical: `https://wetravelgo.com/${locale}/pro/mentions-legales` },
  };
}

export default async function LegalNoticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section className="max-w-3xl">
      <article className="prose prose-sm max-w-none text-foreground/80 prose-headings:text-ocean-dark prose-a:text-terracotta">
        <h1>Mentions légales</h1>
        <p className="text-foreground/50">Dernière mise à jour : 17 août 2026</p>

        <h2>Éditeur du site</h2>
        <p>
          Le site wetravelgo.com est édité par WeTravelGo, plateforme de découverte touristique et de
          référencement d&apos;établissements au Maroc.
          <br />
          Adresse e-mail : <a href="mailto:contact@wetravelgo.com">contact@wetravelgo.com</a>
        </p>

        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis —{" "}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
          .
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur le site wetravelgo.com (textes, images, logos,
          structure) est protégé par la législation marocaine et internationale relative à la propriété
          intellectuelle. Toute reproduction, représentation ou exploitation, totale ou partielle, sans
          autorisation préalable est interdite.
        </p>

        <h2>Responsabilité</h2>
        <p>
          WeTravelGo s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur le site,
          notamment les fiches des établissements partenaires, sans pouvoir garantir leur exhaustivité ou
          leur actualisation permanente. WeTravelGo ne saurait être tenue responsable des erreurs, omissions
          ou de l&apos;indisponibilité des informations.
        </p>

        <h2>Liens hypertextes</h2>
        <p>
          Le site peut contenir des liens vers des sites tiers. WeTravelGo n&apos;exerce aucun contrôle sur
          ces sites et décline toute responsabilité quant à leur contenu.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le traitement des données à caractère personnel est décrit dans notre{" "}
          <a href={`/${locale}/pro/confidentialite`}>Politique de Confidentialité</a>.
        </p>

        <h2>Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit marocain. Tout litige relève de la
          compétence exclusive des tribunaux du Royaume du Maroc.
        </p>

        <h2>Contact</h2>
        <p>
          Pour toute question : <a href="mailto:contact@wetravelgo.com">contact@wetravelgo.com</a>
        </p>
      </article>
    </Section>
  );
}
