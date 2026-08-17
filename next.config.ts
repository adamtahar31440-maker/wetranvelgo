import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
  // www.wetravelgo.com is the canonical domain — matches how the domain is set
  // up on Vercel (apex wetravelgo.com already redirects to www at the DNS/domain
  // level), so the app-level redirect below just mirrors that instead of fighting
  // it. Keeps metadata/alternates/canonical URLs pointed at a single live origin.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "wetravelgo.com" }],
        destination: "https://www.wetravelgo.com/:path*",
        permanent: true,
      },
      // essaouirainside.com is the old single-city domain — Essaouira is now
      // one city among several under wetravelgo.com/{locale}/essaouira, so
      // every incoming link (old fiches, QR posters, indexed Google results)
      // needs to keep working by gaining the "essaouira" city segment.
      {
        source: "/",
        has: [{ type: "host", value: "essaouirainside.com" }],
        destination: "https://www.wetravelgo.com/fr/essaouira",
        permanent: true,
      },
      // The digital-menu QR route is locale-agnostic on both domains (see
      // proxy.ts), so it passes straight through without a city segment.
      {
        source: "/menu/:path*",
        has: [{ type: "host", value: "essaouirainside.com" }],
        destination: "https://www.wetravelgo.com/menu/:path*",
        permanent: true,
      },
      {
        source: "/:locale(fr|en|ar|es|de|it|pt|ru|zh|ko|tr|he)/:path*",
        has: [{ type: "host", value: "essaouirainside.com" }],
        destination: "https://www.wetravelgo.com/:locale/essaouira/:path*",
        permanent: true,
      },
      // Anything else unmatched still lands on the live site rather than 404ing.
      {
        source: "/:path*",
        has: [{ type: "host", value: "essaouirainside.com" }],
        destination: "https://www.wetravelgo.com/fr/essaouira",
        permanent: true,
      },
      // Same fix, but for old essaouirainside.com-style links (no city segment)
      // hit directly on wetravelgo.com itself — e.g. bookmarks, external
      // backlinks, or search results indexed before the multi-city rename.
      // Only "essaouira" exists as a city today, so this is safe; once a
      // second city ships, this fallback should be narrowed or removed.
      {
        source:
          "/:locale(fr|en|ar|es|de|it|pt|ru|zh|ko|tr|he)/:section((?!essaouira|admin|pro|sign-in|sign-up)[^/]+)/:rest*",
        destination: "/:locale/essaouira/:section/:rest*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
