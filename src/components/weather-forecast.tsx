"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { weatherLabel, type DailyForecast } from "@/lib/weather";

export function WeatherForecast({
  daily,
  locale,
  showLabel,
  hideLabel,
}: {
  daily: DailyForecast[];
  locale: string;
  showLabel: string;
  hideLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });

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
        <ul className="mt-2 space-y-1.5 text-sm">
          {daily.map((d) => {
            const label = weatherLabel(d.weatherCode, true);
            return (
              <li key={d.date} className="flex items-center justify-between">
                <span className="w-8 text-foreground/70 capitalize">{dayFormatter.format(new Date(`${d.date}T12:00:00`))}</span>
                <span>{label.emoji}</span>
                <span className="text-foreground/60">
                  {Math.round(d.tempMin)}° / {Math.round(d.tempMax)}°
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
