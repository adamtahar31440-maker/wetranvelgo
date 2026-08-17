"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Globe, UtensilsCrossed, Wine, Tag } from "lucide-react";
import { localeNames, rtlLocales } from "@/i18n/routing";
import type { DigitalMenuItem, Localized } from "@/lib/menu-types";

// No photo uploaded for this item — fall back to a generic dish/drink motif
// rather than leaving a blank box. Variants (glass/bottle...) are the
// strongest drink signal; the category text (checked in French, always
// present) catches drinks priced with a single figure (e.g. a soda).
const DRINK_KEYWORDS =
  /boisson|vin|cocktail|jus|caf[eé]|th[eé]|eau|bi[eè]re|alcool|rhum|whisky|liqueur|drink|ap[eé]ritif|ap[eé]ro|digestif|spiritueux|champagne|soda|sangria|mocktail|shooter/i;
function isLikelyDrink(item: DigitalMenuItem): boolean {
  if (item.variants && item.variants.length > 0) return true;
  return !!item.category?.fr && DRINK_KEYWORDS.test(item.category.fr);
}

export function DigitalMenuView({
  establishmentName,
  logoUrl,
  bannerUrl,
  items,
  initialLocale,
  availableLocales,
  chrome,
  establishmentSlug,
  categorySlug,
  categoryType,
}: {
  establishmentName: Localized;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  items: DigitalMenuItem[];
  initialLocale: string;
  availableLocales: string[];
  chrome: { allCategories: string; noItems: string; poweredBy: string; viewEstablishment: string };
  establishmentSlug: string;
  categorySlug?: string;
  categoryType?: string;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const isRtl = rtlLocales.includes(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [locale, isRtl]);

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const item of items) {
      const label = item.category ? item.category[locale] ?? item.category.fr : null;
      if (label && !seen.has(label)) {
        seen.add(label);
        list.push(label);
      }
    }
    return list;
  }, [items, locale]);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredItems = activeCategory
    ? items.filter((it) => (it.category ? it.category[locale] ?? it.category.fr : null) === activeCategory)
    : items;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
      {bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="" className="h-28 w-full shrink-0 object-cover" />
      )}
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/95 px-5 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center gap-3">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className={`h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow ${
                bannerUrl ? "-mt-12" : ""
              }`}
            />
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-ocean-dark">{establishmentName[locale] ?? establishmentName.fr}</h1>
            {categorySlug && (
              <a
                href={`/${locale}/${categorySlug}/${establishmentSlug}`}
                className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-terracotta hover:underline"
              >
                {chrome.viewEstablishment} <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        </div>

        {availableLocales.length > 1 && (
          <div ref={langMenuRef} className="relative mt-3 inline-block">
            <button
              type="button"
              onClick={() => setLangMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full border border-black/10 bg-sand/50 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand"
            >
              <Globe size={14} />
              {localeNames[locale] ?? locale}
              <ChevronDown size={14} className={langMenuOpen ? "rotate-180" : ""} />
            </button>
            {langMenuOpen && (
              <div className="absolute start-0 top-full z-20 mt-1 max-h-64 w-44 overflow-y-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg">
                {availableLocales.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setLocale(code);
                      setLangMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-start text-xs font-medium ${
                      locale === code
                        ? "bg-ocean-dark/10 text-ocean-dark"
                        : "text-foreground/70 hover:bg-sand/40"
                    }`}
                  >
                    {localeNames[code] ?? code}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {categories.length > 0 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                activeCategory === null
                  ? "border-terracotta bg-terracotta/10 text-terracotta"
                  : "border-black/10 text-foreground/60 hover:bg-sand/40"
              }`}
            >
              {chrome.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                  activeCategory === cat
                    ? "border-terracotta bg-terracotta/10 text-terracotta"
                    : "border-black/10 text-foreground/60 hover:bg-sand/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 px-5 py-4">
        {filteredItems.length === 0 ? (
          <p className="mt-10 text-center text-sm text-foreground/50">{chrome.noItems}</p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, i) => {
              const name = item.name[locale] ?? item.name.fr;
              const description = item.description ? item.description[locale] ?? item.description.fr : null;
              return (
                <div key={i} className="flex gap-3 rounded-2xl border border-black/5 p-4">
                  {item.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo}
                      alt=""
                      className="h-28 w-28 shrink-0 rounded-xl border border-black/5 object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-sand/50 text-foreground/25">
                      {categoryType === "restaurant" ? (
                        isLikelyDrink(item) ? <Wine size={32} /> : <UtensilsCrossed size={32} />
                      ) : (
                        <Tag size={32} />
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground/90">{name}</span>
                      {item.price != null && (
                        <span className="shrink-0 text-sm font-semibold text-ocean-dark">{item.price} MAD</span>
                      )}
                    </div>
                    {description && <p className="mt-1 text-xs leading-relaxed text-foreground/60">{description}</p>}
                    {item.variants && item.variants.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {item.variants.map((v, vi) => (
                          <span key={vi} className="text-xs text-foreground/70">
                            {v.label[locale] ?? v.label.fr} — <span className="font-semibold text-ocean-dark">{v.price} MAD</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-black/5 px-5 py-4 text-center">
        <a href={`https://wetravelgo.com/${locale}`} className="text-xs font-medium text-foreground/40 hover:text-terracotta">
          {chrome.poweredBy}
        </a>
      </footer>
    </div>
  );
}
