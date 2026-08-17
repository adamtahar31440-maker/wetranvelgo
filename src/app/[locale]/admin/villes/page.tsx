import Link from "next/link";
import { adminGetCities, adminCountEstablishmentsByCity } from "@/lib/admin-data";
import { setCityStatus } from "@/lib/admin-actions";

export default async function AdminCitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const items = await adminGetCities();
  const counts = await Promise.all(items.map((c) => adminCountEstablishmentsByCity(c.id)));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ocean-dark">Villes</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Chaque ville active devient un site public complet sous wetravelgo.com/{"{"}ville{"}"}, avec son lien
            d&apos;inscription pro.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/villes/new`}
          className="shrink-0 rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean"
        >
          + Ajouter une ville
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Adresse web</th>
              <th className="px-4 py-3">Établissements</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c, i) => (
              <tr key={c.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">{c.name.fr}</td>
                <td className="px-4 py-3 text-foreground/70">wetravelgo.com/{c.slug}</td>
                <td className="px-4 py-3 text-foreground/70">{counts[i]}</td>
                <td className="px-4 py-3">
                  <form action={setCityStatus.bind(null, c.id, c.status === "active" ? "inactive" : "active")}>
                    <button
                      type="submit"
                      className={
                        c.status === "active"
                          ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700"
                          : "rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600"
                      }
                    >
                      {c.status === "active" ? "Active" : "Désactivée"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/${locale}/admin/villes/${c.id}`} className="text-azur hover:underline">
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-foreground/50">
                  Aucune ville pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
