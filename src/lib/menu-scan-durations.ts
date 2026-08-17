import { getDb } from "@/db";
import { menuScanDurations } from "@/db/schema";
import { desc } from "drizzle-orm";

const FALLBACK_MS_PER_IMAGE = 12000;
const HISTORY_SAMPLE_SIZE = 100;

export async function recordScanDuration(imageCount: number, durationMs: number) {
  const db = getDb();
  await db.insert(menuScanDurations).values({ imageCount, durationMs });
}

// Scales the recent average per-photo duration by this scan's photo count,
// rather than a fixed constant, so the estimate keeps reflecting how the
// extraction model is actually performing (and improves as more scans happen).
export async function getEstimatedScanDurationMs(imageCount: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ imageCount: menuScanDurations.imageCount, durationMs: menuScanDurations.durationMs })
    .from(menuScanDurations)
    .orderBy(desc(menuScanDurations.id))
    .limit(HISTORY_SAMPLE_SIZE);

  if (rows.length === 0) return imageCount * FALLBACK_MS_PER_IMAGE;

  const avgMsPerImage =
    rows.reduce((sum, r) => sum + r.durationMs / Math.max(1, r.imageCount), 0) / rows.length;

  return Math.round(avgMsPerImage * imageCount);
}
