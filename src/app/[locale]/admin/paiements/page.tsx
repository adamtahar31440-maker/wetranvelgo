import { adminGetInvoices, adminGetProfessionals } from "@/lib/admin-data";

export default async function AdminPaymentsPage() {
  const [invoices, professionals] = await Promise.all([adminGetInvoices(), adminGetProfessionals()]);
  const proById = new Map(professionals.map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ocean-dark">Paiements & Factures</h1>
      <p className="mb-6 text-sm text-foreground/60">
        Stripe et PayPal ne sont pas encore connectés — active-les depuis Paramètres une fois tes clés API fournies. En attendant, les paiements manuels (virement, espèces) sont enregistrables ici.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Professionnel</th>
              <th className="px-4 py-3">Montant (MAD)</th>
              <th className="px-4 py-3">Méthode</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Émise le</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">
                  Aucune facture pour le moment.
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">
                  {proById.get(inv.professionalId)?.companyName ?? "—"}
                </td>
                <td className="px-4 py-3 text-foreground/70">{inv.amountMad}</td>
                <td className="px-4 py-3 text-foreground/70">{inv.paymentMethod}</td>
                <td className="px-4 py-3 text-foreground/70">{inv.status}</td>
                <td className="px-4 py-3 text-foreground/70">
                  {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString("fr-FR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
