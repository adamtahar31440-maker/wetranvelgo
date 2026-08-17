import Link from "next/link";
import { adminGetProfessionals, adminGetEstablishments, adminGetCities } from "@/lib/admin-data";
import { deleteProfessional, setProfessionalStatus } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  validated: "Validé",
  refused: "Refusé",
  suspended: "Suspendu",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  validated: "bg-green-100 text-green-700",
  refused: "bg-red-100 text-red-700",
  suspended: "bg-gray-200 text-gray-600",
};

const inputClass = "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";

export default async function AdminProfessionalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; ville?: string }>;
}) {
  const { locale } = await params;
  const { q, ville } = await searchParams;
  const [allItems, establishments, cities] = await Promise.all([
    adminGetProfessionals(),
    adminGetEstablishments(),
    adminGetCities(),
  ]);
  const ficheByProfessionalId = new Map(establishments.map((e) => [e.professionalId, e]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const items = allItems.filter((p) => {
    if (ville && cityById.get(p.cityId)?.slug !== ville) return false;
    if (q && !p.companyName.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Professionnels</h1>

      <form className="mb-4 flex flex-wrap gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher par entreprise..."
          className={`${inputClass} flex-1 min-w-[200px]`}
        />
        <select name="ville" defaultValue={ville ?? ""} className={inputClass}>
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name.fr}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-ocean-dark/10 px-4 py-2 text-sm font-semibold text-ocean-dark hover:bg-ocean-dark/20">
          Filtrer
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Activité</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground/50">
                  Aucun résultat.
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">{p.companyName}</td>
                <td className="px-4 py-3 text-foreground/70">{cityById.get(p.cityId)?.name.fr ?? "—"}</td>
                <td className="px-4 py-3 text-foreground/70">
                  {p.contactName}
                  <br />
                  <span className="text-xs">{p.email}</span>
                </td>
                <td className="px-4 py-3 text-foreground/70">{p.activityType}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_COLORS[p.status])}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {ficheByProfessionalId.has(p.id) && (
                      <Link
                        href={`/${locale}/admin/establissements/${ficheByProfessionalId.get(p.id)!.id}`}
                        className="text-azur hover:underline"
                      >
                        Voir la fiche
                      </Link>
                    )}
                    {p.status !== "validated" && (
                      <form action={setProfessionalStatus.bind(null, p.id, "validated")}>
                        <button type="submit" className="text-green-700 hover:underline">
                          Valider
                        </button>
                      </form>
                    )}
                    {p.status !== "refused" && (
                      <form action={setProfessionalStatus.bind(null, p.id, "refused")}>
                        <button type="submit" className="text-amber-700 hover:underline">
                          Refuser
                        </button>
                      </form>
                    )}
                    {p.status !== "suspended" && (
                      <form action={setProfessionalStatus.bind(null, p.id, "suspended")}>
                        <button type="submit" className="text-gray-600 hover:underline">
                          Suspendre
                        </button>
                      </form>
                    )}
                    <form action={deleteProfessional.bind(null, p.id)}>
                      <ConfirmSubmitButton confirmText={`Supprimer "${p.companyName}" ?`} className="text-red-600 hover:underline">
                        Supprimer
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
