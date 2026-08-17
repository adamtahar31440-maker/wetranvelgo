import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

const COLORS = {
  oceanDark: "#17495e",
  terracotta: "#bf6a45",
  sand: "#fdfaf5",
  text: "#3a3a3a",
};

// Shared chrome for every transactional email — plain inline styles and
// react-email's table-based components (not flexbox/grid) so it renders
// consistently in Outlook/Gmail/Apple Mail, matching the site's palette
// already used on the label certificate/QR poster (next/og renders).
export function BrandedEmailLayout({
  previewText,
  children,
}: {
  previewText: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: COLORS.sand, fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", border: `1px solid #eee` }}>
          <Section style={{ backgroundColor: COLORS.oceanDark, padding: "24px 32px" }}>
            <Text style={{ margin: 0, color: COLORS.terracotta, fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
              ESSAOUIRA INSIDE
            </Text>
          </Section>
          <Section style={{ padding: "32px 32px 8px" }}>{children}</Section>
          <Hr style={{ borderColor: "#eee", margin: "24px 32px 0" }} />
          <Section style={{ padding: "16px 32px 28px" }}>
            <Text style={{ margin: 0, fontSize: 12, color: "#999" }}>
              Essaouira Inside — La plateforme de référence pour découvrir, préparer et vivre Essaouira.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  heading: { color: COLORS.oceanDark, fontSize: 22, fontWeight: 700, margin: "0 0 16px" },
  paragraph: { color: COLORS.text, fontSize: 15, lineHeight: "24px", margin: "0 0 16px" },
  button: {
    display: "inline-block",
    backgroundColor: COLORS.terracotta,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    padding: "12px 24px",
    borderRadius: 999,
    margin: "8px 0 8px",
  },
  buttonSecondary: {
    display: "inline-block",
    backgroundColor: "#ffffff",
    color: COLORS.oceanDark,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    padding: "11px 23px",
    borderRadius: 999,
    border: `1px solid ${COLORS.oceanDark}`,
    margin: "8px 8px 8px 0",
  },
};
