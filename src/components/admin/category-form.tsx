"use client";

import { useState } from "react";
import { upsertCategory } from "@/lib/admin-actions";
import { SubmitButton } from "@/components/submit-button";
import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

type Category = { id: number; slug: string; name: Record<string, string>; icon: string | null };

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export function CategoryForm({ locale, category }: { locale: string; category?: Category }) {
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICON_OPTIONS[0].key);

  return (
    <form action={upsertCategory} className="max-w-xl space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {category && <input type="hidden" name="id" value={category.id} />}

      <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">
        Une catégorie apparaît comme un lien dans la barre de navigation (ex. Restaurants, Activités...).
        Rédigez en français : les autres langues seront traduites automatiquement.
      </p>

      <div>
        <label className={labelClass}>Nom (affiché dans le menu)</label>
        <input name="name" defaultValue={category?.name.fr} className={inputClass} required />
      </div>

      <div>
        <label className={labelClass}>Adresse web (slug)</label>
        <input
          name="slug"
          defaultValue={category?.slug}
          placeholder="Laissez vide pour la générer automatiquement à partir du nom"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-foreground/50">
          Détermine l&apos;adresse publique, ex : essaouirainside.com/boutiques
        </p>
      </div>

      <div>
        <label className={labelClass}>Icône</label>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
          {CATEGORY_ICON_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setIcon(opt.key)}
                title={opt.label}
                className={cn(
                  "flex items-center justify-center rounded-lg border p-2 transition",
                  icon === opt.key ? "border-ocean-dark bg-ocean-dark/10" : "border-black/10 hover:bg-sand/40"
                )}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
        <input type="hidden" name="icon" value={icon} />
      </div>

      <SubmitButton label="Enregistrer" pendingLabel="Traduction et enregistrement en cours..." />
    </form>
  );
}
