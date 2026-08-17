"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

type Plan = {
  key: string;
  name: Record<string, string>;
  priceMonthlyMad: number;
  priceYearlyMad: number;
  features: Record<string, string[]> | null;
};

export function SubscriptionPlans({ plans, currentPlanKey }: { plans: Plan[]; currentPlanKey?: string }) {
  const locale = useLocale();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(planKey: string) {
    setError(null);
    setLoadingKey(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billingCycle: cycle, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(
          data.error === "stripe_not_configured"
            ? "Le paiement en ligne n'est pas encore activé — contacte l'équipe Essaouira Inside."
            : "Une erreur est survenue, réessaie plus tard."
        );
        setLoadingKey(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Une erreur est survenue, réessaie plus tard.");
      setLoadingKey(null);
    }
  }

  const paidPlans = plans.filter((p) => p.priceMonthlyMad > 0);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setCycle("monthly")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            cycle === "monthly" ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10 text-foreground/70"
          )}
        >
          Mensuel
        </button>
        <button
          onClick={() => setCycle("yearly")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            cycle === "yearly" ? "border-ocean-dark bg-ocean-dark text-white" : "border-black/10 text-foreground/70"
          )}
        >
          Annuel (2 mois offerts)
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {paidPlans.map((plan) => {
          const price = cycle === "yearly" ? plan.priceYearlyMad : plan.priceMonthlyMad;
          const isCurrent = plan.key === currentPlanKey;
          return (
            <div key={plan.key} className="rounded-2xl border border-black/5 bg-white p-5">
              <p className="text-sm font-semibold text-ocean-dark">{plan.name.fr}</p>
              <p className="mt-1 text-xl font-semibold text-terracotta">
                {price} MAD <span className="text-xs font-normal text-foreground/50">/ {cycle === "yearly" ? "an" : "mois"}</span>
              </p>
              <ul className="mt-3 space-y-1 text-xs text-foreground/60">
                {plan.features?.fr?.slice(0, 4).map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
              <button
                onClick={() => subscribe(plan.key)}
                disabled={isCurrent || loadingKey === plan.key}
                className="mt-4 w-full rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean disabled:opacity-50"
              >
                {isCurrent ? "Plan actuel" : loadingKey === plan.key ? "Redirection..." : "S'abonner"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
