import type { Metadata } from "next";

// Pages under /admin and /pro link the "WeTravelGo Pro" installable app
// instead of the public one, so installing from there gives merchants and
// staff an icon that opens straight onto their dashboard.
export const proAppMetadata: Metadata = {
  manifest: "/pro.webmanifest",
  appleWebApp: { capable: true, title: "WeTravelGo Pro", statusBarStyle: "default" },
  icons: { apple: "/icons/pro-apple-touch-icon.png" },
};
