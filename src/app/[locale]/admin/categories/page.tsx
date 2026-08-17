import Link from "next/link";
import { adminGetCategories, adminCountEstablishmentsByCategory } from "@/lib/admin-data";
import { deleteCategory, moveCategory, setCategoryStatus } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";
import { getCategoryIcon } from "@/lib/category-icons";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const items = await adminGetCategories();
  const counts = await Promise.all(items.map((c) => adminCountEstablishmentsByCategory(c.id)));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ocean-dark">Catégories</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Chaque catégorie apparaît comme un lien dans la navigation (ex. Restaurants, Activités...) et regroupe des
            établissements. Gérez leurs sous-catégories depuis la page de modification.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/categories/new`}
          className="shrink-0 rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean"
        >
          + Nouvelle catégorie
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Ordre</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Adresse web</th>
              <th className="px-4 py-3">Établissements</th>
              <th className="px-4 py-3">Visible</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c, i) => {
              const Icon = getCategoryIcon(c.icon);
              return (
                <tr key={c.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <form action={moveCategory.bind(null, c.id, "up")}>
                        <button
                          type="submit"
                          disabled={i === 0}
                          className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                          aria-label="Monter"
                        >
                          ▲
                        </button>
                      </form>
                      <form action={moveCategory.bind(null, c.id, "down")}>
                        <button
                          type="submit"
                          disabled={i === items.length - 1}
                          className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                          aria-label="Descendre"
                        >
                          ▼
                        </button>
                      </form>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ocean-dark">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-foreground/50" />
                      {c.name.fr}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">essaouirainside.com/{c.slug}</td>
                  <td className="px-4 py-3 text-foreground/70">{counts[i]}</td>
                  <td className="px-4 py-3">
                    <form action={setCategoryStatus.bind(null, c.id, c.status === "active" ? "inactive" : "active")}>
                      <button
                        type="submit"
                        className={
                          c.status === "active"
                            ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700"
                            : "rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600"
                        }
                      >
                        {c.status === "active" ? "Activée" : "Masquée"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/${locale}/admin/categories/${c.id}`} className="text-azur hover:underline">
                        Modifier
                      </Link>
                      <form action={deleteCategory.bind(null, c.id)}>
                        <ConfirmSubmitButton
                          confirmText={
                            counts[i] > 0
                              ? `"${c.name.fr}" contient ${counts[i]} établissement(s) et ne peut pas être supprimée tant qu'ils y sont. Ouvrir quand même la suppression (elle échouera) ?`
                              : `Supprimer "${c.name.fr}" et ses sous-catégories ?`
                          }
                          className="text-red-600 hover:underline"
                        >
                          Supprimer
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
