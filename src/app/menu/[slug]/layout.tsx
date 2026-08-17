import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "../../globals.css";

const inter = Inter({ variable: "--font-body", subsets: ["latin"] });

// Standalone route on purpose: this is the page a QR code on a restaurant table
// points to, so it must not be locale-prefixed (a printed QR can't adapt per
// scanner) — see DigitalMenuView for the in-page language switcher instead.
// The root app layout is a bare pass-through (see src/app/layout.tsx), so this
// route needs its own <html>/<body>, same as [locale]/layout.tsx does.
export default function MenuLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-sand/20">{children}</body>
    </html>
  );
}
