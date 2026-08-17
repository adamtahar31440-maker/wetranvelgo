"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, Search, Globe, ChevronDown } from "lucide-react";
import { localeNames, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; pages?: { href: string; label: string }[] };

export function Header({
  ville,
  siteName = "WeTravelGo",
  cityLabel,
  navLinks = [],
}: {
  ville: string;
  siteName?: string;
  cityLabel?: string;
  navLinks?: NavLink[];
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (href: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });

  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
  const localePrefixed = (href: string) => `/${locale}/${ville}${href === "/" ? "" : href}`;
  const [siteNameFirst, ...siteNameRest] = siteName.split(" ");

  return (
    <header className="relative z-50 border-b border-black/5 bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={`/${locale}/${ville}`} className="shrink-0 leading-tight">
          <span className="block text-lg font-semibold tracking-tight text-ocean-dark">
            {siteNameFirst}
            {siteNameRest.length > 0 && <> <span className="text-terracotta">{siteNameRest.join(" ")}</span></>}
          </span>
          {cityLabel && (
            <span className="block text-xs font-medium uppercase tracking-wide text-foreground/50">
              {cityLabel}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link href={`/${locale}/${ville}`} className="text-sm font-medium text-foreground/80 transition hover:text-ocean-dark">
            {t("home")}
          </Link>
          {navLinks.map((link) =>
            link.pages && link.pages.length > 0 ? (
              <div key={link.href || link.label} className="group relative">
                {link.href ? (
                  <Link
                    href={localePrefixed(link.href)}
                    className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition hover:text-ocean-dark"
                  >
                    {link.label}
                    <ChevronDown size={14} className="transition group-hover:rotate-180" />
                  </Link>
                ) : (
                  <span className="flex cursor-default items-center gap-1 text-sm font-medium text-foreground/80 transition group-hover:text-ocean-dark">
                    {link.label}
                    <ChevronDown size={14} className="transition group-hover:rotate-180" />
                  </span>
                )}
                <div className="invisible absolute left-0 top-full z-20 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 rtl:left-auto rtl:right-0">
                  <div className="w-56 rounded-xl border border-black/10 bg-white p-2 shadow-lg">
                    {link.pages.map((p) => (
                      <Link
                        key={p.href}
                        href={localePrefixed(p.href)}
                        className="block rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-sand/50 hover:text-ocean-dark"
                      >
                        {p.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={localePrefixed(link.href)}
                className="text-sm font-medium text-foreground/80 transition hover:text-ocean-dark"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={`/${locale}/${ville}/recherche`}
            aria-label={t("search")}
            className="rounded-full p-2 text-foreground/70 transition hover:bg-sand/60 hover:text-ocean-dark"
          >
            <Search size={18} />
          </Link>
          <LocaleSwitcher pathWithoutLocale={pathWithoutLocale} />
        </div>

        <button
          className="rounded-md p-2 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-background px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            <Link
              href={`/${locale}/${ville}`}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-sand/50"
            >
              {t("home")}
            </Link>
            {navLinks.map((link) => {
              const groupKey = link.href || link.label;
              return link.pages && link.pages.length > 0 ? (
                <div key={groupKey}>
                  <div className="flex items-center rounded-md hover:bg-sand/50">
                    {link.href ? (
                      <Link
                        href={localePrefixed(link.href)}
                        onClick={() => setOpen(false)}
                        className="flex-1 px-2 py-2 text-sm font-medium text-foreground/80"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(groupKey)}
                        className="flex-1 px-2 py-2 text-left text-sm font-medium text-foreground/80"
                      >
                        {link.label}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(groupKey)}
                      aria-label={link.label}
                      aria-expanded={expanded.has(groupKey)}
                      className="p-2 text-foreground/60"
                    >
                      <ChevronDown
                        size={16}
                        className={cn("transition", expanded.has(groupKey) && "rotate-180")}
                      />
                    </button>
                  </div>
                  {expanded.has(groupKey) && (
                    <div className="ms-3 flex flex-col gap-0.5 border-s border-black/10 ps-3">
                      {link.pages.map((p) => (
                        <Link
                          key={p.href}
                          href={localePrefixed(p.href)}
                          onClick={() => setOpen(false)}
                          className="rounded-md px-2 py-1.5 text-sm text-foreground/60 hover:bg-sand/50"
                        >
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={localePrefixed(link.href)}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-sand/50"
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href={`/${locale}/${ville}/recherche`}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 hover:bg-sand/50"
            >
              {t("search")}
            </Link>
          </nav>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {routing.locales.map((l) => (
              <Link
                key={l}
                href={`/${l}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-center text-xs font-medium",
                  l === locale ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10"
                )}
              >
                {localeNames[l]}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function LocaleSwitcher({ pathWithoutLocale }: { pathWithoutLocale: string }) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/60"
      >
        <Globe size={14} />
        {localeNames[locale]}
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 grid max-h-80 w-48 grid-cols-1 gap-0.5 overflow-y-auto rounded-xl border border-black/10 bg-white p-2 shadow-lg rtl:right-auto rtl:left-0">
            {routing.locales.map((l) => (
              <Link
                key={l}
                href={`/${l}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  l === locale ? "bg-ocean-dark text-white" : "text-foreground/70 hover:bg-sand/50"
                )}
              >
                {localeNames[l]}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
