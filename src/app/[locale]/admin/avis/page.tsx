import { adminGetReviews, adminGetEstablishments } from "@/lib/admin-data";
import { setReviewStatus, deleteReview } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function AdminReviewsPage() {
  const [reviews, establishments] = await Promise.all([adminGetReviews(), adminGetEstablishments()]);
  const establishmentById = new Map(establishments.map((e) => [e.id, e]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Avis</h1>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3">Auteur</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Commentaire</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground/50">
                  Aucun avis pour le moment.
                </td>
              </tr>
            )}
            {reviews.map((r) => (
              <tr key={r.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">
                  {establishmentById.get(r.establishmentId)?.name.fr ?? "—"}
                </td>
                <td className="px-4 py-3 text-foreground/70">{r.authorName}</td>
                <td className="px-4 py-3 text-foreground/70">{"★".repeat(r.rating)}</td>
                <td className="px-4 py-3 max-w-xs truncate text-foreground/70">{r.comment}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_COLORS[r.status])}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {r.status !== "approved" && (
                      <form action={setReviewStatus.bind(null, r.id, "approved")}>
                        <button type="submit" className="text-green-700 hover:underline">Valider</button>
                      </form>
                    )}
                    {r.status !== "rejected" && (
                      <form action={setReviewStatus.bind(null, r.id, "rejected")}>
                        <button type="submit" className="text-amber-700 hover:underline">Refuser</button>
                      </form>
                    )}
                    <form action={deleteReview.bind(null, r.id)}>
                      <ConfirmSubmitButton confirmText="Supprimer cet avis ?" className="text-red-600 hover:underline">
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
