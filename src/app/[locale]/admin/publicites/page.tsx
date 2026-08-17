import { adminGetAdCampaigns } from "@/lib/admin-data";
import { createAdCampaign, setAdCampaignStatus, deleteAdCampaign } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export default async function AdminAdsPage() {
  const campaigns = await adminGetAdCampaigns();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Publicités</h1>

      <div className="mb-8 rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-ocean-dark">Nouvelle campagne</h2>
        <form action={createAdCampaign} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className={labelClass}>Titre</label>
            <input name="title" className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Emplacement</label>
            <select name="placement" className={inputClass}>
              <option value="home">Accueil</option>
              <option value="search">Recherche</option>
              <option value="category">Catégorie</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select name="campaignType" className={inputClass}>
              <option value="banniere">Bannière</option>
              <option value="article_sponsorise">Article sponsorisé</option>
              <option value="mise_en_avant">Mise en avant</option>
              <option value="badge">Badge sponsorisé</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Début</label>
            <input type="date" name="startDate" className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Fin</label>
            <input type="date" name="endDate" className={inputClass} />
          </div>
          <button type="submit" className="col-span-full w-fit rounded-full bg-ocean-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean">
            Créer
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Emplacement</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Clics / Impressions</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">{c.title}</td>
                <td className="px-4 py-3 text-foreground/70">{c.placement}</td>
                <td className="px-4 py-3 text-foreground/70">{c.campaignType}</td>
                <td className="px-4 py-3 text-foreground/70">{c.clicks} / {c.impressions}</td>
                <td className="px-4 py-3">
                  <form action={setAdCampaignStatus.bind(null, c.id, c.status === "active" ? "paused" : "active")}>
                    <button type="submit" className="rounded-full bg-sand/60 px-3 py-1 text-xs font-semibold text-ocean-dark">
                      {c.status}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={deleteAdCampaign.bind(null, c.id)}>
                    <ConfirmSubmitButton confirmText={`Supprimer "${c.title}" ?`} className="text-red-600 hover:underline">
                      Supprimer
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
