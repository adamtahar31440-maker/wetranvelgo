import Link from "next/link";
import { adminGetLabelApplications, adminGetEstablishments } from "@/lib/admin-data";
import { setLabelApplicationStatus } from "@/lib/admin-actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente d'évaluation",
  info_requested: "Infos demandées",
  visit_scheduled: "Visite programmée",
  on_hold: "En attente",
  approved: "Label attribué",
  refused: "Refusée",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  info_requested: "bg-blue-100 text-blue-800",
  visit_scheduled: "bg-blue-100 text-blue-800",
  on_hold: "bg-black/5 text-foreground/60",
  approved: "bg-green-100 text-green-800",
  refused: "bg-red-100 text-red-800",
};

export default async function LabelApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [applications, establishments] = await Promise.all([
    adminGetLabelApplications(),
    adminGetEstablishments(),
  ]);
  const establishmentName = (id: number) =>
    establishments.find((e) => e.id === id)?.name.fr ?? `#${id}`;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ocean-dark">Candidatures — Label Approved</h1>
      <p className="mb-6 text-sm text-foreground/60">
        Les demandes envoyées par les professionnels depuis leur tableau de bord. L&apos;évaluation détaillée
        (grille /100) et la décision finale (attribuer/refuser) se font depuis la fiche établissement.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id} className="border-b border-black/5 align-top last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">
                  <Link href={`/${locale}/admin/establissements/${a.establishmentId}`} className="hover:underline">
                    {establishmentName(a.establishmentId)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  {a.contactName ?? "—"}
                  <br />
                  <span className="text-xs">{a.phone ?? a.email ?? ""}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-foreground/70">
                  {a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[a.status] ?? STATUS_CLASSES.pending}`}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {["pending", "info_requested", "visit_scheduled", "on_hold"].includes(a.status) ? (
                    <div className="flex flex-wrap gap-2">
                      <form action={setLabelApplicationStatus.bind(null, a.id, "info_requested")}>
                        <button type="submit" className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-foreground/70 hover:bg-black/5">
                          Demander infos
                        </button>
                      </form>
                      <form action={setLabelApplicationStatus.bind(null, a.id, "visit_scheduled")}>
                        <button type="submit" className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-foreground/70 hover:bg-black/5">
                          Programmer visite
                        </button>
                      </form>
                      <form action={setLabelApplicationStatus.bind(null, a.id, "on_hold")}>
                        <button type="submit" className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-foreground/70 hover:bg-black/5">
                          Mettre en attente
                        </button>
                      </form>
                      <form action={setLabelApplicationStatus.bind(null, a.id, "refused")}>
                        <button type="submit" className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">
                          Refuser
                        </button>
                      </form>
                      <Link
                        href={`/${locale}/admin/establissements/${a.establishmentId}`}
                        className="rounded-full bg-ocean-dark px-3 py-1 text-xs font-semibold text-white hover:bg-ocean"
                      >
                        Évaluer →
                      </Link>
                    </div>
                  ) : (
                    <span className="text-xs text-foreground/40">Traitée</span>
                  )}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">
                  Aucune candidature pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
