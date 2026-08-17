"use client";

import { upsertCity } from "@/lib/admin-actions";
import { SubmitButton } from "@/components/submit-button";
import { SingleImageField } from "@/components/single-image-field";

type City = {
  id: number;
  slug: string;
  name: Record<string, string>;
  lat: number | null;
  lng: number | null;
  heroImage: string | null;
};

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export function CityForm({ locale, city }: { locale: string; city?: City }) {
  return (
    <form action={upsertCity} className="max-w-xl space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {city && <input type="hidden" name="id" value={city.id} />}

      <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">
        Une ville devient immédiatement accessible sur wetravelgo.com/{"{"}ville{"}"} et son propre lien
        d&apos;inscription pro s&apos;active automatiquement — rien d&apos;autre à configurer. Rédigez en français :
        les autres langues seront traduites automatiquement.
      </p>

      <div>
        <label className={labelClass}>Nom de la ville</label>
        <input name="name" defaultValue={city?.name.fr} className={inputClass} required />
      </div>

      <div>
        <label className={labelClass}>Adresse web (slug)</label>
        <input
          name="slug"
          defaultValue={city?.slug}
          placeholder="Laissez vide pour la générer automatiquement à partir du nom"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-foreground/50">
          Détermine l&apos;adresse publique, ex : wetravelgo.com/essaouira
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Latitude (centre de la ville)</label>
          <input name="lat" type="number" step="any" defaultValue={city?.lat ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Longitude (centre de la ville)</label>
          <input name="lng" type="number" step="any" defaultValue={city?.lng ?? ""} className={inputClass} />
        </div>
      </div>
      <p className="-mt-3 text-xs text-foreground/50">
        Utilisées pour présélectionner automatiquement cette ville quand un pro s&apos;inscrit avec une adresse
        proche.
      </p>

      <SingleImageField
        name="heroImage"
        label="Photo de couverture (page d'accueil wetravelgo.com)"
        defaultValue={city?.heroImage}
        shape="banner"
      />

      <SubmitButton label="Enregistrer" pendingLabel="Traduction et enregistrement en cours..." />
    </form>
  );
}
