"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { upsertContentPage } from "@/lib/admin-actions";
import { ProductsEditor } from "@/components/products-editor";
import { ImageUploader } from "@/components/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MapSectionToggle } from "@/components/admin/map-section-toggle";
import { MapPointsEditor } from "@/components/admin/map-points-editor";
import { ALL_LOCALES, LOCALE_LABELS } from "@/lib/localized-form";

type LocaleStatus = "pending" | "loading" | "done" | "error";
const TARGET_LOCALES = ALL_LOCALES.filter((l) => l !== "fr");

type City = { id: number; slug: string; name: Record<string, string> };

type ContentPage = {
  id: number;
  cityId: number;
  section: string;
  slug: string;
  title: Record<string, string>;
  body: Record<string, string>;
  coverImage: string | null;
  prices?: { name: Record<string, string>; price: number | null; category: Record<string, string> | null }[] | null;
  mapEnabled?: boolean | null;
  mapPoints?: { label: string; lat: number; lng: number }[] | null;
};

type CustomSection = { slug: string; name: Record<string, string> };

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export function ContentPageForm({
  locale,
  page,
  customSections = [],
  cities,
}: {
  locale: string;
  page?: ContentPage;
  customSections?: CustomSection[];
  cities: City[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [statuses, setStatuses] = useState<LocaleStatus[]>(() => TARGET_LOCALES.map(() => "pending"));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current || saving) return;

    setSaving(true);
    setSaveError(false);
    setStatuses(TARGET_LOCALES.map(() => "pending"));

    const formData = new FormData(formRef.current);
    const title = String(formData.get("title") ?? "");
    const body = String(formData.get("body") ?? "");
    let pricesInput: { name: string; price: number | null; category: string | null }[] = [];
    try {
      pricesInput = JSON.parse(String(formData.get("prices") ?? "[]"));
    } catch {
      pricesInput = [];
    }

    const fields: Record<string, string> = { title, body };
    pricesInput.forEach((p, i) => {
      if (p.name) fields[`price_${i}`] = p.name;
      if (p.category) fields[`priceCategory_${i}`] = p.category;
    });

    // Changing just the cover image (or another non-text field) shouldn't re-translate
    // text that hasn't changed — reuse the page's existing translations instead of
    // making 11 AI calls for nothing. Compare with line endings normalized: a <textarea>
    // read back via FormData always reports "\n", but content saved before this browser
    // normalization kicked in (or entered on Windows) can still have stored "\r\n", which
    // made this comparison spuriously fail and fall through to the slow path every time.
    const normalizeText = (s: string) => s.replace(/\r\n/g, "\n");
    const originalPrices = (page?.prices ?? []).map((p) => ({
      name: p.name.fr,
      price: p.price,
      category: p.category?.fr ?? null,
    }));
    const textUnchanged =
      !!page &&
      normalizeText(title) === normalizeText(page.title.fr) &&
      normalizeText(body) === normalizeText(page.body.fr) &&
      JSON.stringify(pricesInput) === JSON.stringify(originalPrices);

    const allTranslations: Record<string, Record<string, string>> = {};
    if (textUnchanged && page) {
      for (const targetLocale of TARGET_LOCALES) {
        const flat: Record<string, string> = {
          title: page.title[targetLocale] ?? page.title.fr,
          body: page.body[targetLocale] ?? page.body.fr,
        };
        (page.prices ?? []).forEach((p, i) => {
          if (p.name[targetLocale]) flat[`price_${i}`] = p.name[targetLocale];
          if (p.category?.[targetLocale]) flat[`priceCategory_${i}`] = p.category[targetLocale];
        });
        allTranslations[targetLocale] = flat;
      }
      setStatuses(TARGET_LOCALES.map(() => "done"));
    } else {
      // Translate one language at a time so the checklist below reflects what the
      // server has actually finished, not a simulated timer.
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
          const flat: Record<string, string> = {};
          for (const [field, byLocale] of Object.entries(data)) {
            if (byLocale[targetLocale]) flat[field] = byLocale[targetLocale];
          }
          allTranslations[targetLocale] = flat;
          setStatuses((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
        } catch {
          allTranslations[targetLocale] = {};
          setStatuses((prev) => prev.map((s, idx) => (idx === i ? "error" : s)));
        }
      }
    }

    formData.set("translations", JSON.stringify(allTranslations));

    try {
      await upsertContentPage(formData);
      setSaving(false);
      router.push(`/${locale}/admin/pages`);
      router.refresh();
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError(true);
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {page && <input type="hidden" name="id" value={page.id} />}
      {page && <input type="hidden" name="slug" value={page.slug} />}

      <div>
        <label className={labelClass}>Ville</label>
        <select name="cityId" defaultValue={page?.cityId ?? cities[0]?.id} className={inputClass} required>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name.fr ?? c.slug}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className={labelClass}>Section</label>
          <Link href={`/${locale}/admin/sections/new`} className="text-xs font-medium text-azur hover:underline">
            + Créer une nouvelle section
          </Link>
        </div>
        <select name="section" defaultValue={page?.section ?? "assistance-guides"} className={inputClass}>
          <option value="assistance-guides">Assistance — Guides pratiques</option>
          {customSections.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name.fr}
            </option>
          ))}
        </select>
      </div>

      <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">
        Rédigez en français : les autres langues du site seront automatiquement retraduites lors de l&apos;enregistrement
        (mise en forme et photos conservées).
      </p>

      <div>
        <label className={labelClass}>Titre</label>
        <input name="title" defaultValue={page?.title.fr} className={inputClass} required />
      </div>
      <div>
        <RichTextEditor
          name="body"
          label="Contenu"
          defaultValue={page?.body.fr}
          unsupportedFormatText='Format non supporté (souvent des photos iPhone en HEIC). Réglages > Appareil photo > Formats > "Le plus compatible", puis reprenez la photo — ou choisissez une photo déjà au format JPEG/PNG.'
        />
      </div>

      <ImageUploader
        label="Image de couverture"
        fieldName="coverImage"
        max={1}
        defaultImages={page?.coverImage ? [page.coverImage] : []}
        unsupportedFormatText='Format non supporté (souvent des photos iPhone en HEIC). Réglages > Appareil photo > Formats > "Le plus compatible", puis reprenez la photo — ou choisissez une photo déjà au format JPEG/PNG.'
      />

      <div>
        <label className={labelClass}>Tarifs (facultatif)</label>
        <p className="mb-2 text-xs text-foreground/50">
          Ex : plusieurs tarifs différents (jour/nuit, par destination...). La catégorie permet de les regrouper
          (ex : &quot;Jour&quot; / &quot;Nuit&quot;).
        </p>
        <ProductsEditor
          name="prices"
          defaultProducts={(page?.prices ?? []).map((p) => ({
            name: p.name.fr,
            price: p.price,
            category: p.category?.fr ?? null,
          }))}
          namePlaceholder="Ex : Centre-ville"
          pricePlaceholder="Prix (DH)"
          categoryPlaceholder="Jour / Nuit"
          addLabel="Ajouter un tarif"
          scanLabel="Scanner un document"
          scanningLabel="Analyse en cours..."
          scanHint="Vous pouvez aussi prendre en photo une liste de tarifs déjà imprimée."
          scanErrorText="L'analyse a échoué. Veuillez réessayer."
          scanSuccessTemplate="{count} tarif(s) ajouté(s)."
        />
      </div>

      <MapSectionToggle label="Afficher une carte sur cette page" defaultEnabled={!!page?.mapEnabled}>
        <MapPointsEditor
          name="mapPoints"
          defaultPoints={page?.mapPoints ?? []}
          labelPlaceholder="Nom du point (ex : Station Bab Sbaa)"
          addressPlaceholder="Rechercher une adresse..."
          addLabel="Ajouter un point"
          notLocatedText="Non localisé"
          missingKeyText="Carte indisponible : clé API Google Maps non configurée."
          errorText="Impossible de charger Google Maps."
          dragHint="Faites glisser un repère sur la carte pour ajuster précisément sa position."
        />
      </MapSectionToggle>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ocean-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Traduction et enregistrement en cours..." : "Enregistrer"}
        </button>
        {saveError && !saving && (
          <p className="mt-2 text-xs font-medium text-red-600">L&apos;enregistrement a échoué. Réessayez.</p>
        )}
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
