import { adminGetSubscriptions, adminGetProfessionals, getSubscriptionPlans } from "@/lib/admin-data";
import { changeSubscriptionPlan } from "@/lib/admin-actions";

export default async function AdminSubscriptionsPage() {
  const [subscriptions, professionals, plans] = await Promise.all([
    adminGetSubscriptions(),
    adminGetProfessionals(),
    getSubscriptionPlans(),
  ]);
  const proById = new Map(professionals.map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Abonnements</h1>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-black/5 bg-white p-5">
            <p className="text-sm font-semibold text-ocean-dark">{plan.name.fr}</p>
            <p className="mt-1 text-2xl font-semibold text-terracotta">
              {plan.priceMonthlyMad === 0 ? "Gratuit" : `${plan.priceMonthlyMad} MAD/mois`}
            </p>
            {plan.priceMonthlyMad > 0 && (
              <p className="text-xs text-foreground/50">
                ou {plan.priceYearlyMad} MAD/an (2 mois offerts)
              </p>
            )}
            <ul className="mt-3 space-y-1 text-xs text-foreground/60">
              {plan.features?.fr?.slice(0, 4).map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Professionnel</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Cycle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Changer de plan</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">
                  Aucun abonnement actif pour le moment.
                </td>
              </tr>
            )}
            {subscriptions.map((s) => (
              <tr key={s.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">
                  {proById.get(s.professionalId)?.companyName ?? "—"}
                </td>
                <td className="px-4 py-3 text-foreground/70">{s.planKey}</td>
                <td className="px-4 py-3 text-foreground/70">{s.billingCycle}</td>
                <td className="px-4 py-3 text-foreground/70">{s.status}</td>
                <td className="px-4 py-3">
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await changeSubscriptionPlan(
                        s.professionalId,
                        String(formData.get("planKey")),
                        formData.get("billingCycle") as "monthly" | "yearly"
                      );
                    }}
                    className="flex items-center gap-2"
                  >
                    <select name="planKey" defaultValue={s.planKey} className="rounded-lg border border-black/10 px-2 py-1 text-xs">
                      {plans.map((p) => (
                        <option key={p.key} value={p.key}>{p.key}</option>
                      ))}
                    </select>
                    <select name="billingCycle" defaultValue={s.billingCycle} className="rounded-lg border border-black/10 px-2 py-1 text-xs">
                      <option value="monthly">Mensuel</option>
                      <option value="yearly">Annuel</option>
                    </select>
                    <button type="submit" className="text-azur hover:underline">Appliquer</button>
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
