import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export function Footer({
  ville,
  siteName = "WeTravelGo",
  cityLabel,
  activeModules = [],
  navLinks = [],
}: {
  ville: string;
  siteName?: string;
  cityLabel?: string;
  activeModules?: string[];
  navLinks?: { href: string; label: string }[];
}) {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const locale = useLocale();

  const year = new Date().getFullYear();
  const isActive = (key?: string) => !key || activeModules.includes(key);

  const exploreLinks = [
    ...navLinks,
    ...(isActive("assistance") ? [{ href: "/assistance", label: nav("assistance") }] : []),
  ];
  const [siteNameFirst, ...siteNameRest] = siteName.split(" ");

  return (
    <footer className="mt-24 border-t border-black/5 bg-ocean-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold">
              {siteNameFirst}
              {siteNameRest.length > 0 && <> <span className="text-terracotta">{siteNameRest.join(" ")}</span></>}
            </p>
            <p className="mt-3 text-sm text-white/70">{t("tagline")}</p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
              {t("explore")}
            </p>
            <ul className="mt-3 space-y-2">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link href={`/${locale}/${ville}${l.href}`} className="text-sm text-white/80 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
              {t("about")}
            </p>
            <ul className="mt-3 space-y-2">
              <li><Link href={`/${locale}/${ville}/contact`} className="text-sm text-white/80 hover:text-white">{t("contact")}</Link></li>
              <li><Link href={`/${locale}/${ville}/mentions-legales`} className="text-sm text-white/80 hover:text-white">{t("legal")}</Link></li>
              <li><Link href={`/${locale}/pro/confidentialite`} className="text-sm text-white/80 hover:text-white">{t("privacy")}</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
              wetravelgo.com
            </p>
            <p className="mt-3 text-sm text-white/70">{cityLabel ?? ville}, Maroc</p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
          © {year} {siteName} — {t("rights")}
        </div>
      </div>
    </footer>
  );
}
