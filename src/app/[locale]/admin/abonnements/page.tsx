import { adminGetSubscriptions, adminGetProfessionals, adminGetEstablishments, getSubscriptionPlans } from "@/lib/admin-data";
import { changeSubscriptionPlan } from "@/lib/admin-actions";

export default async function AdminSubscriptionsPage() {
  const [subscriptions, professionals, establishments, plans] = await Promise.all([
    adminGetSubscriptions(),
    adminGetProfessionals(),
    adminGetEstablishments(),
    getSubscriptionPlans(),
  ]);
  const proById = new Map(professionals.map((p) => [p.id, p]));
  // A professional can run several establishments, each on its own plan —
  // list every establishment (not just ones that already have a subscription
  // row, since "starter" has none) so admin can grant/change any business's
  // quota, Stripe being disabled for now.
  const subByEstablishmentId = new Map(subscriptions.map((s) => [s.establishmentId, s]));

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
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Cycle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Changer de plan</th>
            </tr>
          </thead>
          <tbody>
            {establishments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground/50">
                  Aucun établissement pour le moment.
                </td>
              </tr>
            )}
            {establishments.map((e) => {
              const sub = e.professionalId != null ? subByEstablishmentId.get(e.id) : undefined;
              return (
                <tr key={e.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-ocean-dark">
                    {e.professionalId != null ? proById.get(e.professionalId)?.companyName ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{e.name.fr}</td>
                  <td className="px-4 py-3 text-foreground/70">{sub?.planKey ?? "starter"}</td>
                  <td className="px-4 py-3 text-foreground/70">{sub?.billingCycle ?? "monthly"}</td>
                  <td className="px-4 py-3 text-foreground/70">{sub?.status ?? "—"}</td>
                  <td className="px-4 py-3">
                    {e.professionalId != null && (
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          await changeSubscriptionPlan(
                            e.professionalId!,
                            e.id,
                            String(formData.get("planKey")),
                            formData.get("billingCycle") as "monthly" | "yearly"
                          );
                        }}
                        className="flex items-center gap-2"
                      >
                        <select name="planKey" defaultValue={sub?.planKey ?? "starter"} className="rounded-lg border border-black/10 px-2 py-1 text-xs">
                          {plans.map((p) => (
                            <option key={p.key} value={p.key}>{p.key}</option>
                          ))}
                        </select>
                        <select name="billingCycle" defaultValue={sub?.billingCycle ?? "monthly"} className="rounded-lg border border-black/10 px-2 py-1 text-xs">
                          <option value="monthly">Mensuel</option>
                          <option value="yearly">Annuel</option>
                        </select>
                        <button type="submit" className="text-azur hover:underline">Appliquer</button>
                      </form>
                    )}
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
