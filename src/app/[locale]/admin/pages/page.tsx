import Link from "next/link";
import { adminGetContentPages, adminGetSiteSections, adminGetCities } from "@/lib/admin-data";
import { deleteContentPage, moveContentPage } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";

const inputClass = "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";

export default async function AdminPagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; ville?: string }>;
}) {
  const { locale } = await params;
  const { q, ville } = await searchParams;
  const [allItems, customSections, cities] = await Promise.all([
    adminGetContentPages(),
    adminGetSiteSections(),
    adminGetCities(),
  ]);
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const sectionLabels: Record<string, string> = { "assistance-guides": "Assistance — Guides pratiques" };
  for (const s of customSections) sectionLabels[s.slug] = s.name.fr;

  const items = allItems.filter((p) => {
    if (ville && cityById.get(p.cityId)?.slug !== ville) return false;
    if (q && !p.title.fr?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const groups = new Map<string, typeof items>();
  for (const p of items) {
    const key = `${p.section}::${p.cityId}`;
    const group = groups.get(key) ?? [];
    group.push(p);
    groups.set(key, group);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-ocean-dark">Pages de contenu</h1>
        <Link
          href={`/${locale}/admin/pages/new`}
          className="rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean"
        >
          + Nouvelle page
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher par titre..."
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

      <div className="space-y-8">
        {Array.from(groups.entries()).map(([key, pages]) => {
          const [section, cityIdStr] = key.split("::");
          const cityName = cityById.get(Number(cityIdStr))?.name.fr ?? "—";
          return (
            <div key={key}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/60">
                {sectionLabels[section] ?? section} — {cityName}
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
                    <tr>
                      <th className="px-4 py-3">Ordre</th>
                      <th className="px-4 py-3">Titre</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((p, i) => (
                      <tr key={p.id} className="border-b border-black/5 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <form action={moveContentPage.bind(null, p.id, "up")}>
                              <button
                                type="submit"
                                disabled={i === 0}
                                className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                                aria-label="Monter"
                              >
                                ▲
                              </button>
                            </form>
                            <form action={moveContentPage.bind(null, p.id, "down")}>
                              <button
                                type="submit"
                                disabled={i === pages.length - 1}
                                className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                                aria-label="Descendre"
                              >
                                ▼
                              </button>
                            </form>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-ocean-dark">{p.title.fr}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Link href={`/${locale}/admin/pages/${p.id}`} className="text-azur hover:underline">
                              Modifier
                            </Link>
                            <form action={deleteContentPage.bind(null, p.id)}>
                              <ConfirmSubmitButton confirmText={`Supprimer "${p.title.fr}" ?`} className="text-red-600 hover:underline">
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
        })}
        {items.length === 0 && <p className="text-center text-foreground/50">Aucun résultat.</p>}
      </div>
    </div>
  );
}
