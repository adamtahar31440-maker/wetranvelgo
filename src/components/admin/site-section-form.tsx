"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { upsertSiteSection } from "@/lib/admin-actions";
import { ALL_LOCALES, LOCALE_LABELS } from "@/lib/localized-form";

type LocaleStatus = "pending" | "loading" | "done" | "error";
const TARGET_LOCALES = ALL_LOCALES.filter((l) => l !== "fr");

type SiteSection = {
  id: number;
  slug: string;
  name: Record<string, string>;
};

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export function SiteSectionForm({ locale, section }: { locale: string; section?: SiteSection }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<LocaleStatus[]>(() => TARGET_LOCALES.map(() => "pending"));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current || saving) return;

    setSaving(true);
    setSaveError(null);
    setStatuses(TARGET_LOCALES.map(() => "pending"));

    const formData = new FormData(formRef.current);
    const name = String(formData.get("name") ?? "");
    const fields = { name };

    const allTranslations: Record<string, Record<string, string>> = {};
    for (let i = 0; i < TARGET_LOCALES.length; i++) {
      const targetLocale = TARGET_LOCALES[i];
      setStatuses((prev) => prev.map((s, idx) => (idx === i ? "loading" : s)));
      try {
        const res = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields, locales: [targetLocale] }),
        });
        const data = res.ok ? ((await res.json()) as Record<string, Record<string, string>>) : {};
        allTranslations[targetLocale] = data.name?.[targetLocale] ? { name: data.name[targetLocale] } : {};
        setStatuses((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
      } catch {
        allTranslations[targetLocale] = {};
        setStatuses((prev) => prev.map((s, idx) => (idx === i ? "error" : s)));
      }
    }

    formData.set("translations", JSON.stringify(allTranslations));

    try {
      await upsertSiteSection(formData);
      setSaving(false);
      router.push(`/${locale}/admin/sections`);
      router.refresh();
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError(err instanceof Error ? err.message : "L'enregistrement a échoué. Réessayez.");
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {section && <input type="hidden" name="id" value={section.id} />}

      <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">
        Une section apparaît comme un nouveau lien dans la barre de navigation du site.
        Rédigez en français : les autres langues seront traduites automatiquement.
      </p>

      <div>
        <label className={labelClass}>Nom (affiché dans le menu)</label>
        <input name="name" defaultValue={section?.name.fr} className={inputClass} required />
      </div>

      <div>
        <label className={labelClass}>Adresse web (slug)</label>
        <input
          name="slug"
          defaultValue={section?.slug}
          placeholder="Laissez vide pour la générer automatiquement à partir du nom"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-foreground/50">
          Détermine l&apos;adresse publique, ex : essaouirainside.com/transport
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ocean-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Traduction et enregistrement en cours..." : "Enregistrer"}
        </button>
        {saveError && !saving && <p className="mt-2 text-xs font-medium text-red-600">{saveError}</p>}
        {saving && (
          <div className="mt-3 space-y-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
              <div className="h-full w-1/3 rounded-full bg-ocean-dark animate-progress-slide" />
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
              {TARGET_LOCALES.map((targetLocale, i) => (
                <li
                  key={targetLocale}
                  className={
                    "flex items-center gap-1 " +
                    (statuses[i] === "done" ? "text-foreground" : "text-foreground/40")
                  }
                >
                  {statuses[i] === "done" ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : statuses[i] === "loading" ? (
                    <Loader2 size={12} className="animate-spin text-ocean-dark" />
                  ) : statuses[i] === "error" ? (
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                  ) : (
                    <span className="h-3 w-3 rounded-full border border-black/20" />
                  )}
                  {LOCALE_LABELS[targetLocale]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
}
