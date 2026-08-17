import { getDashboardStats } from "@/lib/admin-data";
import { StatCard } from "@/components/admin/stat-card";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ocean-dark">Tableau de bord</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Établissements" value={stats.establishments} />
        <StatCard label="Professionnels" value={stats.professionals} />
        <StatCard label="Avis en attente" value={stats.reviewsPending} />
        <StatCard label="Abonnements actifs" value={stats.activeSubscriptions} />
        <StatCard label="Abonnés newsletter" value={stats.newsletterSubscribers} />
        <StatCard label="Scans QR" value={stats.menuScans} />
      </div>
    </div>
  );
}
