import { getDb } from "@/db";
import { tideCache } from "@/db/schema";
import { eq } from "drizzle-orm";

export type LocationId = "essaouira" | "sidiKaouki" | "ghazoua" | "moulayBouzerktoune" | "diabat" | "airport";

export type Location = { id: LocationId; label: string; lat: number; lng: number; coastal: boolean };

export const LOCATIONS: Location[] = [
  { id: "essaouira", label: "Essaouira", lat: 31.5085, lng: -9.7595, coastal: true },
  { id: "diabat", label: "Diabat", lat: 31.47924, lng: -9.76554, coastal: true },
  { id: "sidiKaouki", label: "Sidi Kaouki", lat: 31.393, lng: -9.7367, coastal: true },
  { id: "ghazoua", label: "Ghazoua", lat: 31.44982, lng: -9.73306, coastal: false },
  { id: "moulayBouzerktoune", label: "Moulay Bouzerktoune", lat: 31.645563, lng: -9.675993, coastal: true },
  { id: "airport", label: "Aéroport d'Essaouira", lat: 31.3975, lng: -9.68167, coastal: false },
];

export function getLocation(id: string | null): Location {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
}

export type DailyForecast = { date: string; weatherCode: number | null; tempMax: number; tempMin: number };

export type WeatherConditions = {
  temperature: number | null;
  weatherCode: number | null;
  isDay: boolean;
  windSpeed: number | null;
  waveHeight: number | null;
  swellPeriod: number | null;
  seaTemperature: number | null;
  tides: { time: string; type: "high" | "low"; height: number }[] | null;
  daily: DailyForecast[] | null;
};

// "key" points at a "weather.codeXxx" translation key (see messages/*.json) —
// the human-readable description must never be hardcoded in one language here,
// it has to go through next-intl so every locale gets its own text.
const WEATHER_LABELS: Record<number, { day: string; night: string; key: string }> = {
  0: { day: "☀️", night: "🌙", key: "codeClear" },
  1: { day: "🌤️", night: "🌙", key: "codeMostlyClear" },
  2: { day: "⛅", night: "☁️", key: "codePartlyCloudy" },
  3: { day: "☁️", night: "☁️", key: "codeCloudy" },
  45: { day: "🌫️", night: "🌫️", key: "codeFog" },
  48: { day: "🌫️", night: "🌫️", key: "codeFreezingFog" },
  51: { day: "🌦️", night: "🌧️", key: "codeDrizzle" },
  61: { day: "🌧️", night: "🌧️", key: "codeLightRain" },
  63: { day: "🌧️", night: "🌧️", key: "codeRain" },
  65: { day: "🌧️", night: "🌧️", key: "codeHeavyRain" },
  80: { day: "🌦️", night: "🌧️", key: "codeShowers" },
  95: { day: "⛈️", night: "⛈️", key: "codeThunderstorm" },
};

export function weatherLabel(code: number | null, isDay: boolean) {
  const entry = code !== null ? WEATHER_LABELS[code] : undefined;
  if (!entry) return { emoji: "🌡️", key: "codeUnknown" };
  return { emoji: isDay ? entry.day : entry.night, key: entry.key };
}

async function fetchWeather(lat: number, lng: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&models=ecmwf_ifs025&timezone=auto`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("weather fetch failed");
  const data = await res.json();
  const daily: DailyForecast[] = (data.daily?.time ?? []).map((date: string, i: number) => ({
    date,
    weatherCode: data.daily?.weather_code?.[i] ?? null,
    tempMax: data.daily?.temperature_2m_max?.[i],
    tempMin: data.daily?.temperature_2m_min?.[i],
  }));
  return {
    temperature: data.current?.temperature_2m ?? null,
    weatherCode: data.current?.weather_code ?? null,
    isDay: data.current?.is_day !== 0,
    windSpeed: data.current?.wind_speed_10m ?? null,
    daily,
  };
}

async function fetchMarine(lat: number, lng: number) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,swell_wave_period,sea_surface_temperature&timezone=auto`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("marine fetch failed");
  const data = await res.json();
  return {
    waveHeight: data.current?.wave_height ?? null,
    swellPeriod: data.current?.swell_wave_period ?? null,
    seaTemperature: data.current?.sea_surface_temperature ?? null,
  };
}

type Tide = { time: string; type: "high" | "low"; height: number };

// Tide predictions are astronomical (moon/sun position), not a weather model, so
// they come from a separate provider (Stormglass) rather than Open-Meteo. Their
// free tier is a hard 10 requests/day, shared across every coastal spot AND
// every deploy — Next's per-fetch `revalidate` cache resets on each deploy, and
// this project redeploys often, so relying on it alone blew through the quota
// (100+ requests logged against a 10/day cap). Postgres survives deploys, so
// the real cache lives there: refresh at most once per TTL, and if Stormglass
// is unreachable or quota-exhausted, keep serving the last known tides (stale
// but real) instead of hiding the widget.
const TIDE_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const TIDE_STALE_FALLBACK_MS = 4 * 24 * 60 * 60 * 1000;

async function fetchTides(locationId: LocationId, lat: number, lng: number): Promise<Tide[] | null> {
  const db = getDb();
  const rows = await db.select().from(tideCache).where(eq(tideCache.locationId, locationId)).limit(1);
  const cached = rows[0];
  const cacheAgeMs = cached ? Date.now() - cached.fetchedAt.getTime() : Infinity;

  if (cached && cacheAgeMs < TIDE_CACHE_TTL_MS) {
    return cached.tides as Tide[];
  }

  const key = process.env.STORMGLASS_API_KEY;
  if (!key) return (cached?.tides as Tide[]) ?? null;

  try {
    // Morocco is UTC+1 year-round (no DST since 2018) — compute "today" in that
    // offset rather than the server's UTC clock, so the window doesn't drift by
    // an hour and drop the last tide of the day right when it's needed.
    const nowInMorocco = new Date(Date.now() + 60 * 60 * 1000);
    const start = new Date(Date.UTC(nowInMorocco.getUTCFullYear(), nowInMorocco.getUTCMonth(), nowInMorocco.getUTCDate()) - 60 * 60 * 1000);
    const end = new Date(start.getTime() + 96 * 60 * 60 * 1000);

    // The Postgres cache above already gates how often this ever runs (at most
    // once per TIDE_CACHE_TTL_MS) — `no-store` here would additionally force
    // every page that renders the weather widget into fully dynamic rendering,
    // defeating ISR for the entire (site) layout. force-cache is safe: Next's
    // fetch cache is just a secondary layer on top of the real Postgres gate.
    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}&start=${start.toISOString()}&end=${end.toISOString()}`;
    const res = await fetch(url, { headers: { Authorization: key }, cache: "force-cache" });
    if (!res.ok) throw new Error("tide fetch failed");
    const data = await res.json();
    const tides: Tide[] = (data.data ?? []).map((t: { time: string; type: string; height: number }) => ({
      time: t.time,
      type: t.type === "high" ? "high" : "low",
      height: t.height,
    }));

    await db
      .insert(tideCache)
      .values({ locationId, tides, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: tideCache.locationId, set: { tides, fetchedAt: new Date() } });

    return tides;
  } catch {
    // Quota exceeded, network error, etc. — fall back to whatever we last
    // stored rather than blanking the tide section, as long as it's not too old.
    if (cached && cacheAgeMs < TIDE_STALE_FALLBACK_MS) return cached.tides as Tide[];
    return null;
  }
}

export async function getConditionsFor(locationId: string): Promise<WeatherConditions> {
  const location = getLocation(locationId);
  const [weather, marine, tides] = await Promise.all([
    fetchWeather(location.lat, location.lng).catch(() => null),
    location.coastal ? fetchMarine(location.lat, location.lng).catch(() => null) : Promise.resolve(null),
    location.coastal ? fetchTides(location.id, location.lat, location.lng).catch(() => null) : Promise.resolve(null),
  ]);

  return {
    temperature: weather?.temperature ?? null,
    weatherCode: weather?.weatherCode ?? null,
    isDay: weather?.isDay ?? true,
    windSpeed: weather?.windSpeed ?? null,
    waveHeight: marine?.waveHeight ?? null,
    swellPeriod: marine?.swellPeriod ?? null,
    seaTemperature: marine?.seaTemperature ?? null,
    tides: tides ?? null,
    daily: weather?.daily ?? null,
  };
}
