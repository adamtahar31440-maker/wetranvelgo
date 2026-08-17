import { Section, Text } from "@react-email/components";
import { BrandedEmailLayout, emailStyles } from "./branded-layout";

export function ActivationEmail({
  contactName,
  companyName,
  dashboardUrl,
  listingUrl,
  catalogLabel,
}: {
  contactName: string;
  companyName: string;
  dashboardUrl: string;
  listingUrl: string | null;
  // e.g. "Menu digital", "Catalogue digital", "Biens immobiliers" — see qrFeatureLabel.
  catalogLabel: string;
}) {
  return (
    <BrandedEmailLayout previewText={`Votre compte Essaouira Inside a été validé, ${companyName} !`}>
      <Text style={emailStyles.heading}>Bonne nouvelle, {contactName} ✅</Text>
      <Text style={emailStyles.paragraph}>
        Votre compte Essaouira Inside a bien été validé par nos équipes — merci de votre confiance ! La fiche de{" "}
        <strong>{companyName}</strong> reste bien sûr en ligne.
      </Text>
      <Text style={emailStyles.paragraph}>
        Vous pouvez continuer à modifier votre fiche, ajouter des photos ou votre {catalogLabel.toLowerCase()} à
        tout moment depuis votre tableau de bord.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        {listingUrl && (
          <a href={listingUrl} style={emailStyles.button}>
            Voir ma fiche
          </a>
        )}
        <a href={dashboardUrl} style={emailStyles.buttonSecondary}>
          Mon tableau de bord
        </a>
      </Section>
    </BrandedEmailLayout>
  );
}
