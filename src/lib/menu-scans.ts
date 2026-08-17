import { getDb } from "@/db";
import { menuScans, establishments } from "@/db/schema";
import { eq, count, gte } from "drizzle-orm";

export async function recordMenuScan(establishmentId: number) {
  const db = getDb();
  await db.insert(menuScans).values({ establishmentId });
}

export async function getTotalMenuScans() {
  const db = getDb();
  const rows = await db.select({ c: count() }).from(menuScans);
  return rows[0]?.c ?? 0;
}

// Ranked per-establishment breakdown for the admin stats page: every
// establishment with the digital catalog feature on, alongside its all-time
// and last-30-days scan counts (ones that never got a scan still show up, at 0).
export async function getMenuScanStats() {
  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [withCatalogEnabled, totals, recent] = await Promise.all([
    db.select().from(establishments).where(eq(establishments.menuTranslationEnabled, true)),
    db.select({ establishmentId: menuScans.establishmentId, total: count() }).from(menuScans).groupBy(menuScans.establishmentId),
    db
      .select({ establishmentId: menuScans.establishmentId, total: count() })
      .from(menuScans)
      .where(gte(menuScans.scannedAt, thirtyDaysAgo))
      .groupBy(menuScans.establishmentId),
  ]);

  const totalsByEstablishment = new Map(totals.map((r) => [r.establishmentId, r.total]));
  const recentByEstablishment = new Map(recent.map((r) => [r.establishmentId, r.total]));

  return withCatalogEnabled
    .map((establishment) => ({
      establishment,
      totalScans: totalsByEstablishment.get(establishment.id) ?? 0,
      last30DaysScans: recentByEstablishment.get(establishment.id) ?? 0,
    }))
    .sort((a, b) => b.totalScans - a.totalScans);
}
