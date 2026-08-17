import { notFound } from "next/navigation";
import { adminGetCategoryById, adminGetSubcategories, adminCountEstablishmentsBySubcategory } from "@/lib/admin-data";
import { upsertSubcategory, deleteSubcategory, moveSubcategory } from "@/lib/admin-actions";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const category = await adminGetCategoryById(Number(id));
  if (!category) notFound();

  const subcategories = await adminGetSubcategories(category.id);
  const counts = await Promise.all(
    subcategories.map((s) => adminCountEstablishmentsBySubcategory(category.id, s.slug))
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Modifier : {category.name.fr}</h1>
        <CategoryForm locale={locale} category={category} />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold text-ocean-dark">Sous-catégories</h2>
        <p className="mb-4 text-sm text-foreground/60">
          Utilisées comme filtres sur la page de la catégorie et dans le formulaire d&apos;établissement.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
              <tr>
                <th className="px-4 py-3">Ordre</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Établissements</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((s, i) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <form action={moveSubcategory.bind(null, s.id, "up")}>
                        <button
                          type="submit"
                          disabled={i === 0}
                          className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                          aria-label="Monter"
                        >
                          ▲
                        </button>
                      </form>
                      <form action={moveSubcategory.bind(null, s.id, "down")}>
                        <button
                          type="submit"
                          disabled={i === subcategories.length - 1}
                          className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                          aria-label="Descendre"
                        >
                          ▼
                        </button>
                      </form>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ocean-dark">{s.name.fr}</td>
                  <td className="px-4 py-3 text-foreground/70">{counts[i]}</td>
                  <td className="px-4 py-3">
                    <form action={deleteSubcategory.bind(null, s.id)}>
                      <ConfirmSubmitButton
                        confirmText={
                          counts[i] > 0
                            ? `"${s.name.fr}" contient ${counts[i]} établissement(s) et ne peut pas être supprimée tant qu'ils y sont. Ouvrir quand même la suppression (elle échouera) ?`
                            : `Supprimer "${s.name.fr}" ?`
                        }
                        className="text-red-600 hover:underline"
                      >
                        Supprimer
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {subcategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-foreground/50">
                    Aucune sous-catégorie pour l&apos;instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={upsertSubcategory} className="mt-4 flex max-w-md items-end gap-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="categoryId" value={category.id} />
          <div className="flex-1">
            <label className={labelClass}>Nouvelle sous-catégorie</label>
            <input name="name" placeholder="Ex. Vegan" className={inputClass} required />
          </div>
          <SubmitButton label="Ajouter" pendingLabel="Traduction..." />
        </form>
      </div>
    </div>
  );
}
