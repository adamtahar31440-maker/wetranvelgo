"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LOCATIONS, weatherLabel, type LocationId, type WeatherConditions } from "@/lib/weather";
import { WeatherForecast } from "@/components/weather-forecast";
import { TideForecast } from "@/components/tide-forecast";

export function WeatherContent({
  initialLocationId,
  initialConditions,
  locale,
  strings,
  codeLabels,
}: {
  initialLocationId: LocationId;
  initialConditions: WeatherConditions;
  locale: string;
  strings: {
    unavailable: string;
    waves: string;
    tide: string;
    highTide: string;
    lowTide: string;
    weeklyForecast: string;
    hideForecast: string;
    upcomingTides: string;
    hideTides: string;
    wind: string;
    seaTemperature: string;
  };
  codeLabels: Record<string, string>;
}) {
  const [locationId, setLocationId] = useState<LocationId>(initialLocationId);
  const [conditions, setConditions] = useState(initialConditions);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const location = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];
  const label = weatherLabel(conditions.weatherCode, conditions.isDay);
  const labelText = codeLabels[label.key] ?? codeLabels.codeUnknown;
  const timeFormatter = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  const numberFormatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nextTide = conditions.tides?.find((tide) => new Date(tide.time).getTime() >= Date.now());

  async function selectLocation(id: LocationId) {
    setPickerOpen(false);
    if (id === locationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/weather?location=${id}`);
      const data = await res.json();
      setConditions(data);
      setLocationId(id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="flex items-center gap-1 text-xs font-semibold text-ocean-dark"
        >
          {location.label}
          <ChevronDown size={12} className={pickerOpen ? "rotate-180 transition" : "transition"} />
        </button>
        {pickerOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-xl border border-black/10 bg-white p-1 shadow-sm">
            {LOCATIONS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => selectLocation(l.id)}
                className={
                  "block w-full rounded-lg px-3 py-1.5 text-left text-sm " +
                  (l.id === locationId ? "font-semibold text-ocean-dark" : "text-foreground/70 hover:bg-sand/40")
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={"flex items-center justify-between gap-2" + (loading ? " opacity-50" : "")}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{label.emoji}</span>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {conditions.temperature !== null ? `${numberFormatter.format(conditions.temperature)}°C` : strings.unavailable}
            </p>
            <p className="text-xs text-foreground/60">{labelText}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-foreground/50">{strings.wind}</p>
          <p className="text-sm font-medium text-foreground">
            {conditions.windSpeed !== null ? `${Math.round(conditions.windSpeed)} km/h` : strings.unavailable}
          </p>
        </div>
      </div>

      {location.coastal && (
        <div className={"grid grid-cols-3 gap-3 border-t border-black/5 pt-3 text-sm" + (loading ? " opacity-50" : "")}>
          <div>
            <p className="text-xs font-semibold text-foreground/50">{strings.waves}</p>
            <p className="font-medium text-foreground">
              {conditions.waveHeight !== null ? `${numberFormatter.format(conditions.waveHeight)} m` : strings.unavailable}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground/50">{strings.seaTemperature}</p>
            <p className="font-medium text-foreground">
              {conditions.seaTemperature !== null ? `${numberFormatter.format(conditions.seaTemperature)}°C` : strings.unavailable}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground/50">{strings.tide}</p>
            {nextTide ? (
              <p className="font-medium text-foreground">
                {nextTide.type === "high" ? strings.highTide : strings.lowTide} {timeFormatter.format(new Date(nextTide.time))}
              </p>
            ) : (
              <p className="font-medium text-foreground">{strings.unavailable}</p>
            )}
          </div>
        </div>
      )}

      {location.coastal && conditions.tides && conditions.tides.length > 0 && (
        <TideForecast
          tides={conditions.tides}
          locale={locale}
          showLabel={strings.upcomingTides}
          hideLabel={strings.hideTides}
          highTideLabel={strings.highTide}
          lowTideLabel={strings.lowTide}
        />
      )}

      {conditions.daily && conditions.daily.length > 0 && (
        <WeatherForecast
          daily={conditions.daily}
          locale={locale}
          showLabel={strings.weeklyForecast}
          hideLabel={strings.hideForecast}
        />
      )}
    </div>
  );
}
