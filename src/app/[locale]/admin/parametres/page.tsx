import Link from "next/link";
import { getSiteSettings } from "@/lib/admin-data";
import { updateSiteSettings } from "@/lib/admin-actions";
import { getActiveCities } from "@/lib/data";
import { ImageUploader } from "@/components/image-uploader";
import { SubmitButton } from "@/components/submit-button";

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export default async function AdminSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ville?: string }>;
}) {
  const { locale } = await params;
  const { ville } = await searchParams;
  const activeCities = await getActiveCities();
  const currentCity = ville ? activeCities.find((c) => c.slug === ville) ?? activeCities[0] : activeCities[0];
  const cityId = currentCity?.id ?? null;
  const settings = await getSiteSettings(cityId);

  async function save(formData: FormData) {
    "use server";
    const heroImages = String(formData.get("heroImages") ?? "")
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);
    await updateSiteSettings(
      {
        siteName: String(formData.get("siteName") ?? "WeTravelGo"),
        logoUrl: String(formData.get("logoUrl") ?? ""),
        primaryColor: String(formData.get("primaryColor") ?? ""),
        secondaryColor: String(formData.get("secondaryColor") ?? ""),
        contactEmail: String(formData.get("contactEmail") ?? ""),
        heroImages,
      },
      cityId
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ocean-dark">Paramètres</h1>
      {activeCities.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {activeCities.map((c) => (
            <Link
              key={c.id}
              href={`/${locale}/admin/parametres?ville=${c.slug}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                currentCity?.id === c.id ? "bg-ocean-dark text-white" : "bg-black/5 text-foreground/70 hover:bg-black/10"
              }`}
            >
              {c.name.fr ?? c.slug}
            </Link>
          ))}
        </div>
      )}

      <form action={save} className="max-w-2xl space-y-6 rounded-2xl border border-black/5 bg-white p-6">
        <div>
          <label className={labelClass}>Nom du site</label>
          <input name="siteName" defaultValue={settings?.siteName ?? "WeTravelGo"} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>URL du logo</label>
          <input name="logoUrl" defaultValue={settings?.logoUrl ?? ""} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Couleur principale</label>
            <input type="color" name="primaryColor" defaultValue={settings?.primaryColor ?? "#17495e"} className="h-10 w-full rounded-lg border border-black/10" />
          </div>
          <div>
            <label className={labelClass}>Couleur secondaire</label>
            <input type="color" name="secondaryColor" defaultValue={settings?.secondaryColor ?? "#bf6a45"} className="h-10 w-full rounded-lg border border-black/10" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email de contact</label>
          <input name="contactEmail" type="email" defaultValue={settings?.contactEmail ?? ""} className={inputClass} />
        </div>
        <div>
          <ImageUploader
            label="Photos du hero (page d'accueil)"
            hint="1 à 10 photos qui défilent en fond du bandeau d'accueil. Sans photo, le fond bleu uni reste affiché."
            defaultImages={settings?.heroImages ?? []}
            max={10}
            limitReachedText="Maximum 10 photos"
            fieldName="heroImages"
          />
        </div>
        <SubmitButton label="Enregistrer" pendingLabel="Enregistrement..." />
      </form>

      <div className="mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-800">Intégrations tierces</p>
        <p className="mt-1 text-sm text-amber-700">
          SMTP (emails), Stripe, PayPal, Google Maps, Google Analytics, Search Console et Cloudflare nécessitent
          tes propres clés API. Donne-les-moi quand tu es prêt et je les connecte comme variables d&apos;environnement
          Vercel — je ne les stocke jamais dans le code ni la base de données.
        </p>
      </div>
    </div>
  );
}
