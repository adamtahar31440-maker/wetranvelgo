import { Resend } from "resend";
import { WelcomeEmail } from "@/components/emails/welcome-email";
import { ActivationEmail } from "@/components/emails/activation-email";

const FROM = "WeTravelGo <contact@wetravelgo.com>";

let _client: Resend | null = null;
function getClient() {
  if (!_client) _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

// Failures are logged, never thrown — a broken email send must not block
// account creation/validation, both of which are the actual source of truth
// (the DB write already succeeded by the time these are called).
export async function sendWelcomeEmail(to: string, contactName: string, companyName: string) {
  try {
    await getClient().emails.send({
      from: FROM,
      to,
      subject: "Bienvenue sur WeTravelGo 🎉",
      react: WelcomeEmail({
        contactName,
        companyName,
        dashboardUrl: "https://www.wetravelgo.com/fr/pro/dashboard",
      }),
    });
  } catch (err) {
    console.error("Failed to send welcome email to", to, err);
  }
}

export async function sendActivationEmail(
  to: string,
  contactName: string,
  companyName: string,
  listingUrl: string | null,
  catalogLabel: string
) {
  try {
    await getClient().emails.send({
      from: FROM,
      to,
      subject: "Votre compte WeTravelGo a été validé ✅",
      react: ActivationEmail({
        contactName,
        companyName,
        dashboardUrl: "https://www.wetravelgo.com/fr/pro/dashboard",
        listingUrl,
        catalogLabel,
      }),
    });
  } catch (err) {
    console.error("Failed to send activation email to", to, err);
  }
}
