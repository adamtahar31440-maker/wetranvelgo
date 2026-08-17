import Link from "next/link";
import { adminGetSiteSections, adminCountContentPagesBySection } from "@/lib/admin-data";
import { deleteSiteSection, moveSiteSection } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";

export default async function AdminSectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const items = await adminGetSiteSections();
  const counts = await Promise.all(items.map((s) => adminCountContentPagesBySection(s.slug)));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ocean-dark">Sections personnalisées</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Apparaissent comme des liens dans la barre de navigation du site. Les pages elles-mêmes
            se gèrent depuis <Link href={`/${locale}/admin/pages`} className="text-azur hover:underline">Pages</Link>.
          </p>
        </div>
        <Link
          href={`/${locale}/admin/sections/new`}
          className="shrink-0 rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean"
        >
          + Nouvelle section
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Ordre</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Adresse web</th>
              <th className="px-4 py-3">Pages</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, i) => (
              <tr key={s.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <form action={moveSiteSection.bind(null, s.id, "up")}>
                      <button
                        type="submit"
                        disabled={i === 0}
                        className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                        aria-label="Monter"
                      >
                        ▲
                      </button>
                    </form>
                    <form action={moveSiteSection.bind(null, s.id, "down")}>
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
                <td className="px-4 py-3 font-medium text-ocean-dark">{s.name.fr}</td>
                <td className="px-4 py-3 text-foreground/70">essaouirainside.com/{s.slug}</td>
                <td className="px-4 py-3 text-foreground/70">{counts[i]}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/${locale}/admin/sections/${s.id}`} className="text-azur hover:underline">
                      Modifier
                    </Link>
                    <form action={deleteSiteSection.bind(null, s.id)}>
                      <ConfirmSubmitButton
                        confirmText={
                          counts[i] > 0
                            ? `"${s.name.fr}" contient ${counts[i]} page(s), qui resteront mais ne seront plus accessibles. Supprimer quand même ?`
                            : `Supprimer "${s.name.fr}" ?`
                        }
                        className="text-red-600 hover:underline"
                      >
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
