import Link from "next/link";
import { getMenuScanStats, getTotalMenuScans } from "@/lib/menu-scans";
import { getAllCategories } from "@/lib/admin-data";
import { qrFeatureLabel } from "@/lib/qr-feature-label";
import { StatCard } from "@/components/admin/stat-card";

export default async function AdminMenuScansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [stats, total, categories] = await Promise.all([
    getMenuScanStats(),
    getTotalMenuScans(),
    getAllCategories(),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ocean-dark">Scans QR (catalogue digital)</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Nombre de vues du catalogue digital (menu, tarifs, biens...) par établissement — comptabilise toute visite
        de la page (scan du QR/poster principalement, mais aussi les clics depuis la fiche publique).
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Scans au total (tous établissements)" value={total} />
        <StatCard label="Établissements avec catalogue digital" value={stats.length} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3">Scans (30 derniers jours)</th>
              <th className="px-4 py-3">Scans au total</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(({ establishment, totalScans, last30DaysScans }) => (
              <tr key={establishment.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">{establishment.name.fr}</td>
                <td className="px-4 py-3 text-foreground/70">{last30DaysScans}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{totalScans}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/${locale}/admin/establissements/${establishment.id}`} className="text-azur hover:underline">
                      Fiche
                    </Link>
                    <a
                      href={`/menu/${establishment.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-azur hover:underline"
                    >
                      Voir {qrFeatureLabel(categoryById.get(establishment.categoryId)?.type, "fr")}
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-foreground/50">
                  Aucun établissement avec le catalogue digital activé pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
