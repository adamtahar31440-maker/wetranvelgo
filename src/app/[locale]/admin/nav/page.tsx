import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getNavItems } from "@/lib/nav";
import { adminCountEstablishmentsByCategory, adminCountContentPagesBySection } from "@/lib/admin-data";
import { setModuleStatus, setBuiltinNavLabel, moveNavItem, deleteCategory, deleteSiteSection } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";

const TYPE_LABELS: Record<string, string> = {
  builtin: "Fonctionnalité intégrée",
  category: "Catégorie",
  section: "Section personnalisée",
};

export default async function AdminNavPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const items = await getNavItems();
  const tNav = await getTranslations({ locale: "fr", namespace: "nav" });

  const counts = await Promise.all(
    items.map((item) => {
      if (item.type === "category") return adminCountEstablishmentsByCategory(item.id);
      if (item.type === "section") return adminCountContentPagesBySection(item.key);
      return Promise.resolve(0);
    })
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ocean-dark">Navigation</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Tous les liens de la barre de navigation, à un seul endroit. Tarifs et Assistance ne sont pas gérés ici.
          Les catégories et sections personnalisées peuvent être entièrement supprimées.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Ordre</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Adresse web</th>
              <th className="px-4 py-3">Visible</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const displayName = item.label?.fr ?? (item.i18nKey ? tNav(item.i18nKey as never) : item.key);
              const count = counts[i];
              return (
                <tr key={`${item.type}-${item.id}`} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <form action={moveNavItem.bind(null, item.type, item.id, "up")}>
                        <button
                          type="submit"
                          disabled={i === 0}
                          className="rounded border border-black/10 px-1.5 py-0.5 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                          aria-label="Monter"
                        >
                          ▲
                        </button>
                      </form>
                      <form action={moveNavItem.bind(null, item.type, item.id, "down")}>
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
                    {item.type === "builtin" ? (
                      <form action={setBuiltinNavLabel} className="flex items-center gap-2">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="key" value={item.key} />
                        <input
                          name="name"
                          defaultValue={item.label?.fr ?? ""}
                          placeholder={displayName}
                          className="w-40 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-ocean-dark"
                        />
                        <button type="submit" className="text-xs text-azur hover:underline">
                          Enregistrer
                        </button>
                      </form>
                    ) : (
                      displayName
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{TYPE_LABELS[item.type]}</td>
                  <td className="px-4 py-3 text-foreground/70">essaouirainside.com{item.href}</td>
                  <td className="px-4 py-3">
                    {item.type === "builtin" ? (
                      <form action={setModuleStatus.bind(null, item.key, item.active ? "inactive" : "active")}>
                        <button
                          type="submit"
                          className={
                            item.active
                              ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700"
                              : "rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600"
                          }
                        >
                          {item.active ? "Activé" : "Masqué"}
                        </button>
                      </form>
                    ) : item.type === "category" ? (
                      <span className={item.active ? "text-green-700" : "text-gray-500"}>
                        {item.active ? "Activée" : "Masquée"}
                      </span>
                    ) : (
                      <span className="text-green-700">Activée</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.type === "category" && (
                        <>
                          <Link href={`/${locale}/admin/categories/${item.id}`} className="text-azur hover:underline">
                            Modifier
                          </Link>
                          <form action={deleteCategory.bind(null, item.id)}>
                            <ConfirmSubmitButton
                              confirmText={
                                count > 0
                                  ? `"${displayName}" contient ${count} établissement(s) et ne peut pas être supprimée tant qu'ils y sont.`
                                  : `Supprimer "${displayName}" ?`
                              }
                              className="text-red-600 hover:underline"
                            >
                              Supprimer
                            </ConfirmSubmitButton>
                          </form>
                        </>
                      )}
                      {item.type === "section" && (
                        <>
                          <Link href={`/${locale}/admin/sections/${item.id}`} className="text-azur hover:underline">
                            Modifier
                          </Link>
                          <form action={deleteSiteSection.bind(null, item.id)}>
                            <ConfirmSubmitButton
                              confirmText={
                                count > 0
                                  ? `"${displayName}" contient ${count} page(s), qui resteront mais ne seront plus accessibles. Supprimer quand même ?`
                                  : `Supprimer "${displayName}" ?`
                              }
                              className="text-red-600 hover:underline"
                            >
                              Supprimer
                            </ConfirmSubmitButton>
                          </form>
                        </>
                      )}
                      {item.type === "builtin" && <span className="text-foreground/40">—</span>}
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
