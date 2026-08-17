import { adminGetNewsletterSubscribers } from "@/lib/admin-data";
import { deleteNewsletterSubscriber } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";

export default async function AdminNewsletterPage() {
  const subscribers = await adminGetNewsletterSubscribers();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ocean-dark">Newsletter</h1>
      <p className="mb-6 text-sm text-foreground/60">
        {subscribers.length} abonné{subscribers.length > 1 ? "s" : ""}. L&apos;envoi de campagnes nécessite une
        configuration SMTP (Brevo ou équivalent) dans Paramètres.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Langue</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">{s.email}</td>
                <td className="px-4 py-3 text-foreground/70">{s.locale}</td>
                <td className="px-4 py-3 text-foreground/70">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-3">
                  <form action={deleteNewsletterSubscriber.bind(null, s.id)}>
                    <ConfirmSubmitButton confirmText={`Retirer ${s.email} ?`} className="text-red-600 hover:underline">
                      Retirer
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
