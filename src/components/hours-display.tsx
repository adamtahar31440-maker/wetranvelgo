"use client";

import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

// The establishment is in Essaouira, so "today" must reflect Morocco local
// time — not the visitor's own timezone (e.g. a tourist browsing from
// abroad before their trip would otherwise see the wrong day).
function todayIndexInEssaouira() {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Casablanca", weekday: "short" }).format(
    new Date()
  );
  return WEEKDAY_INDEX[weekday] ?? 0;
}

function parseHours(value: string, dayLabels: string[], closedLabel: string) {
  const lines = value.split("\n");
  return dayLabels.map((label) => {
    const line = lines.find((l) => l.trim().toLowerCase().startsWith(label.toLowerCase()));
    if (!line) return { label, text: closedLabel };
    const idx = line.indexOf(":");
    const text = idx >= 0 ? line.slice(idx + 1).trim() : closedLabel;
    return { label, text: text || closedLabel };
  });
}

export function HoursDisplay({
  value,
  dayLabels,
  closedLabel,
  todayLabel,
}: {
  value: string;
  dayLabels: string[];
  closedLabel: string;
  todayLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const days = parseHours(value, dayLabels, closedLabel);
  const todayIndex = todayIndexInEssaouira();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-2 text-left text-sm text-foreground/70"
      >
        <span className="flex items-start gap-2">
          <Clock size={16} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground/80">{todayLabel}</span> : {days[todayIndex].text}
          </span>
        </span>
        <ChevronDown size={14} className={cn("mt-0.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-2 space-y-1 rounded-lg bg-sand/30 p-3">
          {days.map((d, i) => (
            <div
              key={d.label}
              className={cn(
                "flex items-center justify-between text-xs",
                i === todayIndex ? "font-semibold text-ocean-dark" : "text-foreground/60"
              )}
            >
              <span>{d.label}</span>
              <span>{d.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
