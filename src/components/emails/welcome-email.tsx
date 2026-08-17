import { Section, Text } from "@react-email/components";
import { BrandedEmailLayout, emailStyles } from "./branded-layout";

export function WelcomeEmail({
  contactName,
  companyName,
  dashboardUrl,
}: {
  contactName: string;
  companyName: string;
  dashboardUrl: string;
}) {
  return (
    <BrandedEmailLayout previewText={`Bienvenue sur WeTravelGo, ${companyName} !`}>
      <Text style={emailStyles.heading}>Bienvenue, {contactName} 👋</Text>
      <Text style={emailStyles.paragraph}>
        Merci d&apos;avoir créé le compte professionnel de <strong>{companyName}</strong> sur WeTravelGo !
      </Text>
      <Text style={emailStyles.paragraph}>
        Votre fiche est déjà en ligne sur le site ! Configurez-la dès maintenant (description, photos, horaires,
        menu...) depuis votre tableau de bord. Notre équipe examine votre demande de son côté — vous recevrez un
        e-mail de confirmation une fois votre compte définitivement validé.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <a href={dashboardUrl} style={emailStyles.button}>
          Accéder à mon tableau de bord
        </a>
      </Section>
    </BrandedEmailLayout>
  );
}
