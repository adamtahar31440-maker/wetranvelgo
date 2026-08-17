"use client";

import { useState } from "react";

const TARGET_LOCALES = ["en", "ar", "es", "de", "it", "pt", "ru", "zh", "ko", "tr", "he"];

export function AutoTranslateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.closest("form");
    if (!form) return;

    const fields: Record<string, string> = {};
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[name$="_fr"]').forEach((el) => {
      const field = el.name.slice(0, -3);
      if (el.value.trim()) fields[field] = el.value;
    });

    if (Object.keys(fields).length === 0) {
      setError("Remplis d'abord les champs en français.");
      return;
    }

    setLoading(true);
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, locales: TARGET_LOCALES }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const translations: Record<string, Record<string, string>> = await res.json();

      for (const [field, byLocale] of Object.entries(translations)) {
        for (const [locale, text] of Object.entries(byLocale)) {
          const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
            `[name="${field}_${locale}"]`
          );
          if (el) el.value = text;
        }
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de traduction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-ocean-dark/30 bg-ocean-dark/5 px-4 py-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean disabled:opacity-50"
      >
        {loading ? "Traduction en cours..." : "🌍 Traduire automatiquement (11 langues)"}
      </button>
      <span className="text-xs text-foreground/60">
        Remplit les champs EN/AR + les 9 autres langues à partir du texte français.
      </span>
      {done && <span className="text-xs font-medium text-green-700">Traduction appliquée ✓</span>}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}
