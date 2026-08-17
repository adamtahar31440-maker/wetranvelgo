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
    ];
  },
};

export default withNextIntl(nextConfig);
