"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function TideForecast({
  tides,
  locale,
  showLabel,
  hideLabel,
  highTideLabel,
  lowTideLabel,
}: {
  tides: { time: string; type: "high" | "low"; height: number }[];
  locale: string;
  showLabel: string;
  hideLabel: string;
  highTideLabel: string;
  lowTideLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const timeFormatter = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });

  const upcoming = tides.filter((t) => new Date(t.time).getTime() >= Date.now());

  return (
    <div className="border-t border-black/5 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-semibold text-ocean-dark"
      >
        {open ? hideLabel : showLabel}
        <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
      </button>
      {open && (
        <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto text-sm">
          {upcoming.map((t, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-foreground/70 capitalize">{dayFormatter.format(new Date(t.time))}</span>
              <span className="text-foreground/60">{t.type === "high" ? highTideLabel : lowTideLabel}</span>
              <span className="font-medium text-foreground">{timeFormatter.format(new Date(t.time))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
