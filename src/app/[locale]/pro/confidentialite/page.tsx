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
    title: "Politique de confidentialité",
    alternates: { canonical: `https://wetravelgo.com/${locale}/pro/confidentialite` },
  };
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section className="max-w-3xl">
      <article className="prose prose-sm max-w-none text-foreground/80 prose-headings:text-ocean-dark prose-a:text-terracotta">
        <h1>Politique de confidentialité</h1>
        <p className="text-foreground/50">Dernière mise à jour : 17 août 2026</p>

        <h2>1. Responsable du traitement</h2>
        <p>
          WeTravelGo est responsable du traitement des données à caractère personnel collectées via la
          plateforme wetravelgo.com, conformément à la loi n° 09-08 relative à la protection des personnes
          physiques à l&apos;égard du traitement des données à caractère personnel, promulguée par le dahir
          n° 1-09-15 du 18 février 2009, et sous le contrôle de la Commission Nationale de contrôle de la
          protection des Données à caractère Personnel (CNDP).
        </p>

        <h2>2. Données collectées</h2>
        <p>
          Selon l&apos;utilisation de la Plateforme, nous collectons notamment : nom, prénom, adresse
          e-mail, numéro de téléphone, adresse de l&apos;établissement, coordonnées géographiques, contenu
          soumis (photos, descriptions) et données de connexion.
        </p>

        <h2>3. Finalités du traitement</h2>
        <p>Les données sont traitées pour :</p>
        <ul>
          <li>la création et la gestion des comptes utilisateurs et professionnels ;</li>
          <li>la publication et la gestion des fiches établissements ;</li>
          <li>
            la communication avec les utilisateurs (emails de bienvenue, de validation de compte,
            notifications) ;
          </li>
          <li>l&apos;amélioration du service ;</li>
          <li>le respect des obligations légales applicables.</li>
        </ul>

        <h2>4. Base légale</h2>
        <p>
          Le traitement repose sur l&apos;exécution du contrat liant l&apos;utilisateur ou le professionnel à
          WeTravelGo, le consentement de la personne concernée et/ou l&apos;intérêt légitime de WeTravelGo.
        </p>

        <h2>5. Destinataires des données</h2>
        <p>
          Les données sont destinées aux équipes internes de WeTravelGo et, le cas échéant, à ses
          prestataires techniques (hébergement, envoi d&apos;emails, authentification), tenus à une
          obligation de confidentialité.
        </p>

        <h2>6. Durée de conservation</h2>
        <p>
          Les données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont
          été collectées, et conformément aux délais légaux applicables.
        </p>

        <h2>7. Droits des personnes concernées</h2>
        <p>
          Conformément à la loi n° 09-08, toute personne dispose d&apos;un droit d&apos;accès, de
          rectification et d&apos;opposition, pour motif légitime, au traitement de ses données
          personnelles. Ces droits peuvent être exercés en écrivant à{" "}
          <a href="mailto:contact@wetravelgo.com">contact@wetravelgo.com</a>.
        </p>

        <h2>8. Sécurité</h2>
        <p>
          WeTravelGo met en œuvre les mesures techniques et organisationnelles raisonnables pour protéger
          les données contre tout accès non autorisé, perte ou altération.
        </p>

        <h2>9. Contact</h2>
        <p>
          Pour toute question relative à la présente politique :{" "}
          <a href="mailto:contact@wetravelgo.com">contact@wetravelgo.com</a>
        </p>
      </article>
    </Section>
  );
}
