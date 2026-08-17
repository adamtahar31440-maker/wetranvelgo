import { getModules } from "@/lib/admin-data";
import { setModuleStatus } from "@/lib/admin-actions";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  active: "Activé",
  inactive: "Désactivé",
  maintenance: "Maintenance",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-200 text-gray-600",
  maintenance: "bg-amber-100 text-amber-700",
};

// These are now managed as categories (with per-category active/inactive
// status) from /admin/categories instead of via this generic modules toggle.
const SUPERSEDED_BY_CATEGORIES = ["restaurants", "activites", "shopping"];

export default async function AdminModulesPage() {
  const allModules = await getModules();
  const modules = allModules.filter((m) => !SUPERSEDED_BY_CATEGORIES.includes(m.key));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Modules</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4">
            <div>
              <p className="font-medium text-ocean-dark capitalize">{m.key}</p>
              <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[m.status])}>
                {STATUS_LABELS[m.status]}
              </span>
            </div>
            <div className="flex gap-1">
              {(["active", "maintenance", "inactive"] as const).map((s) => (
                <form key={s} action={setModuleStatus.bind(null, m.key, s)}>
                  <button
                    type="submit"
                    disabled={m.status === s}
                    className="rounded-lg border border-black/10 px-2 py-1 text-xs text-foreground/60 hover:bg-sand/40 disabled:opacity-30"
                    title={STATUS_LABELS[s]}
                  >
                    {STATUS_LABELS[s][0]}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
