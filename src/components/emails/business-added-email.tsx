import { Section, Text } from "@react-email/components";
import { BrandedEmailLayout, emailStyles } from "./branded-layout";

export function BusinessAddedEmail({
  contactName,
  companyName,
  listingUrl,
  dashboardUrl,
}: {
  contactName: string;
  // Name of the newly-added establishment (not the account's company name).
  companyName: string;
  listingUrl: string | null;
  dashboardUrl: string;
}) {
  return (
    <BrandedEmailLayout previewText={`Votre nouveau commerce ${companyName} est en ligne sur WeTravelGo !`}>
      <Text style={emailStyles.heading}>Bonne nouvelle, {contactName} 🎉</Text>
      <Text style={emailStyles.paragraph}>
        Votre nouveau commerce <strong>{companyName}</strong> a bien été créé et est déjà en ligne sur WeTravelGo.
      </Text>
      <Text style={emailStyles.paragraph}>
        Il est totalement indépendant de vos autres commerces : sa propre fiche, ses propres photos, son propre
        abonnement. Configurez-le dès maintenant depuis votre tableau de bord.
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
