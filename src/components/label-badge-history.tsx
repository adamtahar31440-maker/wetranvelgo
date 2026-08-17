type Badge = { year: number; status: string };

export function LabelBadgeHistory({ badges, compact }: { badges: Badge[]; compact?: boolean }) {
  if (badges.length === 0) return null;
  const sorted = [...badges].sort((a, b) => a.year - b.year);

  return (
    <div className={compact ? "space-y-1" : "rounded-2xl border border-terracotta/20 bg-terracotta/5 p-5"}>
      {!compact && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-terracotta">
          Essaouira Inside Approved
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {sorted.map((b) => (
          <span
            key={b.year}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
              b.status === "active"
                ? "bg-terracotta/15 text-terracotta"
                : "bg-black/5 text-foreground/40 line-through"
            }`}
          >
            🏆 {b.year} {b.status === "active" ? "✓" : "✗"}
          </span>
        ))}
      </div>
    </div>
  );
}
