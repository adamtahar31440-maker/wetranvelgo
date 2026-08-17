"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";

type Suggestion = { id: number; name: string; image: string | null; href: string };

export function SearchBar() {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(q)}&locale=${locale}`);
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, locale]);

  function goToResults() {
    setOpen(false);
    router.push(`/${locale}/recherche?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
        className="flex w-full items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-lg"
      >
        <Search size={18} className="shrink-0 text-foreground/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          className="w-full bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground/40"
        />
        <button
          type="submit"
          aria-label="search"
          className="shrink-0 rounded-full bg-ocean-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean"
        >
          →
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
          {suggestions.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-sand/50"
            >
              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              )}
              <span className="truncate">{s.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
