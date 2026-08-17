"use client";

import { useRouter } from "next/navigation";
import { ALL_LOCALES, LOCALE_LABELS } from "@/lib/localized-form";

export function DashboardLangSwitcher({ locale, label }: { locale: string; label: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-foreground/60">{label}</label>
      <select
        value={locale}
        onChange={(e) => router.push(`/${e.target.value}/pro/dashboard`)}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
      >
        {ALL_LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </div>
  );
}
