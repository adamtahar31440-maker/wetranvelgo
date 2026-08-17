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
    title: "Conditions générales — Espace Professionnel",
    alternates: { canonical: `https://wetravelgo.com/${locale}/pro/conditions-generales` },
  };
}

export default async function ProTermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section className="max-w-3xl">
      <article className="prose prose-sm max-w-none text-foreground/80 prose-headings:text-ocean-dark prose-a:text-terracotta">
        <h1>Conditions générales d&apos;utilisation — Espace Professionnel</h1>
        <p className="text-foreground/50">Dernière mise à jour : 17 août 2026</p>

        <h2>Article 1 — Objet</h2>
        <p>
          Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent l&apos;accès et
          l&apos;utilisation de l&apos;Espace Professionnel de la plateforme WeTravelGo (« la Plateforme »),
          exploitée conformément à la législation en vigueur au Royaume du Maroc. Elles s&apos;appliquent à
          tout professionnel (restaurant, hébergement, agence, prestataire d&apos;activités, commerce...)
          créant un compte pour référencer son établissement (« le Professionnel »).
        </p>

        <h2>Article 2 — Acceptation</h2>
        <p>
          La création d&apos;un compte professionnel et l&apos;envoi d&apos;une demande d&apos;inscription
          valent acceptation pleine et entière des présentes CGU ainsi que de la{" "}
          <a href={`/${locale}/pro/confidentialite`}>Politique de Confidentialité</a>. Le Professionnel qui
          n&apos;accepte pas ces conditions doit s&apos;abstenir d&apos;utiliser l&apos;Espace Professionnel.
        </p>

        <h2>Article 3 — Inscription et exactitude des informations</h2>
        <p>Le Professionnel garantit :</p>
        <ul>
          <li>
            être légalement habilité à représenter l&apos;établissement inscrit (gérant, propriétaire ou
            mandataire dûment autorisé) ;
          </li>
          <li>
            que les informations fournies (identité, coordonnées, adresse, activité, documents) sont
            exactes, complètes et tenues à jour ;
          </li>
          <li>
            disposer, le cas échéant, des autorisations, patentes, registres de commerce ou licences
            d&apos;exploitation requises par la réglementation marocaine applicable à son activité.
          </li>
        </ul>
        <p>
          WeTravelGo se réserve le droit de demander tout justificatif complémentaire et de suspendre ou
          refuser une inscription en cas de doute sur la véracité des informations fournies.
        </p>

        <h2>Article 4 — Validation et modération</h2>
        <p>
          Toute demande d&apos;inscription fait l&apos;objet d&apos;un examen par les équipes de WeTravelGo.
          La Plateforme se réserve le droit, à sa seule discrétion, de refuser, suspendre ou résilier un
          compte professionnel en cas de non-respect des présentes CGU, de contenu trompeur, illicite ou
          contraire à l&apos;ordre public, ou d&apos;activité non conforme à la réglementation marocaine.
        </p>

        <h2>Article 5 — Contenu publié</h2>
        <p>
          Le Professionnel reste seul responsable du contenu qu&apos;il publie (textes, photos, tarifs,
          horaires). Il garantit détenir les droits nécessaires sur ce contenu et concède à WeTravelGo une
          licence non exclusive, gratuite et mondiale d&apos;utilisation, de reproduction et de diffusion de
          ce contenu sur la Plateforme et ses supports de communication, pour la durée de l&apos;inscription.
        </p>

        <h2>Article 6 — Protection des données personnelles</h2>
        <p>
          Les données à caractère personnel collectées dans le cadre de l&apos;Espace Professionnel sont
          traitées conformément à la loi n° 09-08 relative à la protection des personnes physiques à
          l&apos;égard du traitement des données à caractère personnel et à ses textes d&apos;application,
          sous le contrôle de la Commission Nationale de contrôle de la protection des Données à caractère
          Personnel (CNDP). Pour plus de détails, le Professionnel est invité à consulter la{" "}
          <a href={`/${locale}/pro/confidentialite`}>Politique de Confidentialité</a>.
        </p>

        <h2>Article 7 — Responsabilité</h2>
        <p>
          WeTravelGo agit en tant qu&apos;intermédiaire technique de mise en relation et de référencement.
          Elle ne saurait être tenue responsable des relations contractuelles, litiges ou dommages survenant
          entre le Professionnel et les utilisateurs de la Plateforme.
        </p>

        <h2>Article 8 — Durée et résiliation</h2>
        <p>
          Le compte professionnel est conclu pour une durée indéterminée. Le Professionnel peut demander la
          suppression de son compte à tout moment en contactant{" "}
          <a href="mailto:contact@wetravelgo.com">contact@wetravelgo.com</a>. WeTravelGo peut suspendre ou
          résilier un compte en cas de manquement aux présentes CGU.
        </p>

        <h2>Article 9 — Droit applicable et juridiction compétente</h2>
        <p>
          Les présentes CGU sont soumises au droit marocain. Tout litige relatif à leur interprétation ou
          leur exécution relève de la compétence exclusive des tribunaux compétents du Royaume du Maroc.
        </p>

        <h2>Article 10 — Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU :{" "}
          <a href="mailto:contact@wetravelgo.com">contact@wetravelgo.com</a>
        </p>
      </article>
    </Section>
  );
}
