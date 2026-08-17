import Link from "next/link";
import { adminGetEstablishments, getAllCategories, adminGetCities } from "@/lib/admin-data";
import {
  deleteEstablishment,
  setEstablishmentStatus,
  toggleEstablishmentFeatured,
} from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";

const inputClass = "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";

export default async function AdminEstablishmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; ville?: string }>;
}) {
  const { locale } = await params;
  const { q, ville } = await searchParams;
  const [allEstablishments, categories, cities] = await Promise.all([
    adminGetEstablishments(),
    getAllCategories(),
    adminGetCities(),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const establishments = allEstablishments.filter((e) => {
    if (ville && cityById.get(e.cityId)?.slug !== ville) return false;
    if (q && !e.name.fr?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-ocean-dark">Établissements</h1>
        <Link
          href={`/${locale}/admin/establissements/new`}
          className="rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean"
        >
          + Nouveau
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher par nom..."
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
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Mis en avant</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {establishments.map((e) => (
              <tr key={e.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">{e.name.fr}</td>
                <td className="px-4 py-3 text-foreground/70">{cityById.get(e.cityId)?.name.fr ?? "—"}</td>
                <td className="px-4 py-3 text-foreground/70">
                  {categoryById.get(e.categoryId)?.name.fr ?? "—"} / {e.subcategory}
                </td>
                <td className="px-4 py-3">
                  {e.status === "pending" ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      En attente (candidature pro)
                    </span>
                  ) : (
                    <form action={setEstablishmentStatus.bind(null, e.id, e.status === "active" ? "disabled" : "active")}>
                      <button
                        type="submit"
                        className={
                          e.status === "active"
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                            : "rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600"
                        }
                      >
                        {e.status === "active" ? "Actif" : "Désactivé"}
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-4 py-3">
                  <form action={toggleEstablishmentFeatured.bind(null, e.id, !e.featured)}>
                    <button
                      type="submit"
                      className={
                        e.featured
                          ? "rounded-full bg-terracotta/10 px-3 py-1 text-xs font-semibold text-terracotta"
                          : "rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500"
                      }
                    >
                      {e.featured ? "★ Oui" : "Non"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/${locale}/admin/establissements/${e.id}`}
                      className="text-azur hover:underline"
                    >
                      Modifier
                    </Link>
                    <form action={deleteEstablishment.bind(null, e.id)}>
                      <ConfirmSubmitButton
                        confirmText={`Supprimer "${e.name.fr}" ?`}
                        className="text-red-600 hover:underline"
                      >
                        Supprimer
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {establishments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-foreground/50">
                  Aucun résultat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
