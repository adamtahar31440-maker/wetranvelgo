"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type TimeRange = { open: string; close: string };
type DayState = { closed: boolean; ranges: TimeRange[] };

// The stored value (hours.fr) is always written and read in French,
// regardless of which language the dashboard is currently displayed in —
// otherwise switching the dashboard language would fail to match the days
// against the saved data and silently wipe the entered hours.
const FR_DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const FR_CLOSED = "Fermé";

function parseExisting(value: string): DayState[] {
  const lines = value.split("\n");
  return FR_DAY_LABELS.map((label) => {
    const line = lines.find((l) => l.trim().toLowerCase().startsWith(label.toLowerCase()));
    if (!line) return { closed: false, ranges: [{ open: "", close: "" }] };
    const idx = line.indexOf(":");
    const rest = idx >= 0 ? line.slice(idx + 1).trim() : "";
    if (!rest || rest.toLowerCase() === FR_CLOSED.toLowerCase()) {
      return { closed: true, ranges: [] };
    }
    const ranges = rest
      .split(",")
      .map((r) => {
        const [open, close] = r.trim().split("–").map((s) => s.trim());
        return { open: open ?? "", close: close ?? "" };
      })
      .filter((r) => r.open);
    return { closed: false, ranges: ranges.length > 0 ? ranges : [{ open: "", close: "" }] };
  });
}

export function HoursEditor({
  name,
  defaultValue,
  dayLabels,
  closedLabel,
  openLabel,
  addRangeLabel,
  copyLabel,
}: {
  name: string;
  defaultValue?: string;
  dayLabels: string[];
  closedLabel: string;
  openLabel: string;
  addRangeLabel: string;
  copyLabel: string;
}) {
  const [days, setDays] = useState<DayState[]>(() =>
    defaultValue ? parseExisting(defaultValue) : FR_DAY_LABELS.map(() => ({ closed: false, ranges: [{ open: "", close: "" }] }))
  );

  function setClosed(i: number, closed: boolean) {
    setDays((prev) =>
      prev.map((d, idx) =>
        idx === i
          ? { ...d, closed, ranges: closed ? d.ranges : d.ranges.length ? d.ranges : [{ open: "", close: "" }] }
          : d
      )
    );
  }
  function updateRange(i: number, r: number, field: "open" | "close", value: string) {
    setDays((prev) =>
      prev.map((d, idx) =>
        idx === i
          ? { ...d, ranges: d.ranges.map((rg, ridx) => (ridx === r ? { ...rg, [field]: value } : rg)) }
          : d
      )
    );
  }
  function addRange(i: number) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ranges: [...d.ranges, { open: "", close: "" }] } : d)));
  }
  function removeRange(i: number, r: number) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ranges: d.ranges.filter((_, ridx) => ridx !== r) } : d)));
  }
  function copyPrevious(i: number) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? JSON.parse(JSON.stringify(prev[i - 1])) : d)));
  }

  // Always serialized in French — this string becomes hours.fr, the
  // canonical source text that translateFields later translates from.
  const serialized = FR_DAY_LABELS.map((label, i) => {
    const day = days[i];
    if (day.closed) return `${label}: ${FR_CLOSED}`;
    const ranges = day.ranges.filter((r) => r.open && r.close).map((r) => `${r.open}–${r.close}`);
    if (ranges.length === 0) return null;
    return `${label}: ${ranges.join(", ")}`;
  })
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-2">
      {dayLabels.map((label, i) => {
        const day = days[i];
        return (
          <div key={label} className="rounded-xl border border-black/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground/80">{label}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-foreground/60">
                  <input type="radio" name={`${name}-${i}-status`} checked={!day.closed} onChange={() => setClosed(i, false)} />
                  {openLabel}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-foreground/60">
                  <input type="radio" name={`${name}-${i}-status`} checked={day.closed} onChange={() => setClosed(i, true)} />
                  {closedLabel}
                </label>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => copyPrevious(i)}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-foreground/70 hover:bg-sand/50"
                  >
                    {copyLabel}
                  </button>
                )}
              </div>
            </div>

            {!day.closed && (
              <div className="mt-2 space-y-2">
                {day.ranges.map((r, ridx) => (
                  <div key={ridx} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={r.open}
                      onChange={(e) => updateRange(i, ridx, "open", e.target.value)}
                      className="rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-ocean-dark"
                    />
                    <span className="text-foreground/40">–</span>
                    <input
                      type="time"
                      value={r.close}
                      onChange={(e) => updateRange(i, ridx, "close", e.target.value)}
                      className="rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-ocean-dark"
                    />
                    {day.ranges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRange(i, ridx)}
                        className="rounded-full p-1 text-foreground/40 hover:bg-sand/50 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addRange(i)}
                  className="flex items-center gap-1 text-xs font-medium text-ocean-dark hover:underline"
                >
                  <Plus size={12} /> {addRangeLabel}
                </button>
              </div>
            )}
          </div>
        );
      })}
      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}
