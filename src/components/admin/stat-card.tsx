export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-foreground/60">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ocean-dark">{value}</p>
    </div>
  );
}
