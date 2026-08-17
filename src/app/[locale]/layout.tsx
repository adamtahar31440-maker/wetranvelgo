import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { routing, rtlLocales } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({ variable: "--font-body", subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetravelgo.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "WeTravelGo",
      template: "%s | WeTravelGo",
    },
    description:
      "Découvrez, préparez et vivez chaque ville avec WeTravelGo : hébergements, restaurants, activités et bons plans.",
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${SITE_URL}/${l}`])
      ),
    },
    openGraph: {
      type: "website",
      siteName: "WeTravelGo",
      locale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ClerkProvider>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
