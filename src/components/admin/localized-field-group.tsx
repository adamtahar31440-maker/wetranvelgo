"use client";

import { useState } from "react";

export const EXTRA_LOCALES = ["es", "de", "it", "pt", "ru", "zh", "ko", "tr", "he"] as const;

const LOCALE_LABELS: Record<string, string> = {
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  zh: "中文",
  ko: "한국어",
  tr: "Türkçe",
  he: "עברית",
};

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export function LocalizedFieldGroup({
  field,
  label,
  values,
  multiline,
  rows = 4,
  required,
}: {
  field: string;
  label: string;
  values?: Record<string, string> | null;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}) {
  const [showExtra, setShowExtra] = useState(false);
  const Comp = multiline ? "textarea" : "input";

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["fr", "en", "ar"] as const).map((l) => (
          <div key={l}>
            <label className={labelClass}>
              {label} ({l})
            </label>
            <Comp
              name={`${field}_${l}`}
              defaultValue={values?.[l]}
              rows={multiline ? rows : undefined}
              className={inputClass}
              required={required && l === "fr"}
              dir={l === "ar" ? "rtl" : undefined}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowExtra((s) => !s)}
        className="text-xs font-medium text-ocean-dark hover:underline"
      >
        {showExtra ? "− Masquer" : "+ Afficher"} les 9 autres langues
      </button>

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${showExtra ? "" : "hidden"}`}>
          {EXTRA_LOCALES.map((l) => (
            <div key={l}>
              <label className={labelClass}>
                {label} ({LOCALE_LABELS[l]})
              </label>
              <Comp
                name={`${field}_${l}`}
                defaultValue={values?.[l]}
                rows={multiline ? rows : undefined}
                className={inputClass}
                dir={l === "he" ? "rtl" : undefined}
              />
            </div>
          ))}
      </div>
    </section>
  );
}
