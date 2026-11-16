import { getDb } from "@/db";
import { events, establishments, professionals } from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

// Pro events are shown inside the admin-created site section with this slug
// (the "Evènements" nav entry). Renaming that section's slug in /admin/sections
// would detach them, so it's pinned here.
export const EVENTS_SECTION_SLUG = "evenements";

export type EventRow = typeof events.$inferSelect;

// Event dates are local wall-clock time (see schema) — "now" must be compared
// in the same frame. Every active city is in Morocco today; this becomes a
// per-city timezone column the day a city outside it opens.
const EVENT_TIMEZONE = "Africa/Casablanca";
const notYetOver = sql`coalesce(${events.endsAt}, ${events.startsAt}) >= (now() at time zone ${EVENT_TIMEZONE})`;

export function isEventOver(e: Pick<EventRow, "startsAt" | "endsAt">) {
  const nowLocal = new Intl.DateTimeFormat("sv-SE", {
    timeZone: EVENT_TIMEZONE,
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());
  return (e.endsAt ?? e.startsAt).replace("T", " ") < nowLocal;
}

export async function getUpcomingEvents(cityId: number) {
  const db = getDb();
  return db
    .select()
    .from(events)
    .where(and(eq(events.cityId, cityId), eq(events.status, "approved"), notYetOver))
    .orderBy(asc(events.startsAt));
}

export async function getApprovedEventBySlug(slug: string, cityId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.cityId, cityId), eq(events.slug, slug), eq(events.status, "approved")));
  return rows[0] ?? null;
}

export async function getEventsByProfessionalId(professionalId: number) {
  const db = getDb();
  return db.select().from(events).where(eq(events.professionalId, professionalId)).orderBy(desc(events.startsAt));
}

export async function getEventById(id: number) {
  const db = getDb();
  const rows = await db.select().from(events).where(eq(events.id, id));
  return rows[0] ?? null;
}

export async function adminGetEvents() {
  const db = getDb();
  return db
    .select({ event: events, companyName: professionals.companyName })
    .from(events)
    .leftJoin(professionals, eq(events.professionalId, professionals.id))
    .orderBy(sql`case when ${events.status} = 'pending' then 0 else 1 end`, desc(events.startsAt));
}

export async function getEstablishmentsByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const db = getDb();
  return db.select().from(establishments).where(inArray(establishments.id, ids));
}

// "2026-12-01 20:00:00" → a Date whose UTC fields are that wall-clock time, so
// formatting with timeZone "UTC" prints exactly what the pro entered.
function wallClock(value: string) {
  const [d, t = "00:00"] = value.split(/[ T]/);
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, day, hh, mm));
}

export function formatEventDate(value: string, locale: string, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    dateStyle: style === "long" ? "full" : "medium",
    timeStyle: "short",
  }).format(wallClock(value));
}

export function formatEventRange(e: Pick<EventRow, "startsAt" | "endsAt">, locale: string, style: "long" | "short" = "long") {
  const start = formatEventDate(e.startsAt, locale, style);
  return e.endsAt ? `${start} → ${formatEventDate(e.endsAt, locale, style)}` : start;
}

export function eventDayBadge(value: string, locale: string) {
  const date = wallClock(value);
  return {
    day: new Intl.DateTimeFormat(locale, { timeZone: "UTC", day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: "short" }).format(date),
  };
}

// Value for an <input type="datetime-local">.
export function toDateTimeLocal(value: string | null) {
  return value ? value.replace(" ", "T").slice(0, 16) : "";
}
