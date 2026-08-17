import { upsertEmergencyContact } from "@/lib/admin-actions";
import { SubmitButton } from "@/components/submit-button";
import { AddressLocationPicker } from "@/components/address-location-picker";
import { HoursEditor } from "@/components/hours-editor";

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type City = { id: number; slug: string; name: Record<string, string> };

type Contact = {
  id: number;
  cityId: number;
  category: string;
  name: Record<string, string>;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  hours: Record<string, string> | null;
  notes: Record<string, string> | null;
  website: string | null;
  country: string | null;
  featured: boolean | null;
};

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

const CATEGORIES = [
  ["urgences", "Urgences"],
  ["sante", "Santé"],
  ["securite", "Sécurité"],
  ["ambassade", "Ambassades & Consulats"],
  ["depannage", "Dépannage"],
  ["argent", "Argent"],
  ["transport", "Transport"],
  ["telephone", "Téléphone"],
  ["info_utile", "Infos utiles"],
];

export function EmergencyContactForm({
  locale,
  contact,
  cities,
}: {
  locale: string;
  contact?: Contact;
  cities: City[];
}) {
  return (
    <form action={upsertEmergencyContact} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {contact && <input type="hidden" name="id" value={contact.id} />}

      <div>
        <label className={labelClass}>Ville</label>
        <select name="cityId" defaultValue={contact?.cityId ?? cities[0]?.id} className={inputClass} required>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name.fr ?? c.slug}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Catégorie</label>
        <select name="category" defaultValue={contact?.category ?? "urgences"} className={inputClass}>
          {CATEGORIES.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">
        Rédigez en français : les autres langues du site seront automatiquement retraduites lors de l&apos;enregistrement.
      </p>

      <div>
        <label className={labelClass}>Nom</label>
        <input name="name" defaultValue={contact?.name.fr} className={inputClass} required />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Téléphone</label>
          <input name="phone" defaultValue={contact?.phone ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input name="whatsapp" defaultValue={contact?.whatsapp ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Site internet</label>
          <input name="website" defaultValue={contact?.website ?? ""} className={inputClass} />
        </div>
      </section>

      <div>
        <label className={labelClass}>Adresse</label>
        <AddressLocationPicker
          className={inputClass}
          defaultAddress={contact?.address ?? ""}
          defaultLat={contact?.lat}
          defaultLng={contact?.lng}
        />
      </div>

      <div>
        <label className={labelClass}>Pays (ambassades uniquement)</label>
        <input name="country" defaultValue={contact?.country ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Horaires</label>
        <HoursEditor
          name="hours"
          defaultValue={contact?.hours?.fr ?? ""}
          dayLabels={DAY_LABELS}
          closedLabel="Fermé"
          openLabel="Ouvert"
          copyLabel="Copier la veille"
          addRangeLabel="Ajouter une plage (pause)"
        />
      </div>
      <div>
        <label className={labelClass}>Notes / procédure</label>
        <textarea name="notes" defaultValue={contact?.notes?.fr ?? ""} rows={3} className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={!!contact?.featured} /> Afficher dans le bouton SOS
      </label>

      <SubmitButton label="Enregistrer" pendingLabel="Traduction et enregistrement en cours..." />
    </form>
  );
}
