import { Section, Text } from "@react-email/components";
import { BrandedEmailLayout, emailStyles } from "./branded-layout";

export function ActivationEmail({
  contactName,
  companyName,
  dashboardUrl,
  listings,
  catalogLabel,
}: {
  contactName: string;
  companyName: string;
  dashboardUrl: string;
  // One entry per establishment validated on this account — a pro can run
  // several independent businesses under one login.
  listings: { url: string; name: string }[];
  // e.g. "Menu digital", "Catalogue digital", "Biens immobiliers" — see qrFeatureLabel.
  catalogLabel: string;
}) {
  return (
    <BrandedEmailLayout previewText={`Votre compte WeTravelGo a été validé, ${companyName} !`}>
      <Text style={emailStyles.heading}>Bonne nouvelle, {contactName} ✅</Text>
      <Text style={emailStyles.paragraph}>
        Votre compte WeTravelGo a bien été validé par nos équipes — merci de votre confiance ! La fiche de{" "}
        <strong>{companyName}</strong> reste bien sûr en ligne.
      </Text>
      <Text style={emailStyles.paragraph}>
        Vous pouvez continuer à modifier votre fiche, ajouter des photos ou votre {catalogLabel.toLowerCase()} à
        tout moment depuis votre tableau de bord.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        {listings.map((l) => (
          <a key={l.url} href={l.url} style={emailStyles.button}>
            {listings.length > 1 ? `Voir « ${l.name} »` : "Voir ma fiche"}
          </a>
        ))}
        <a href={dashboardUrl} style={emailStyles.buttonSecondary}>
          Mon tableau de bord
        </a>
      </Section>
    </BrandedEmailLayout>
  );
}
