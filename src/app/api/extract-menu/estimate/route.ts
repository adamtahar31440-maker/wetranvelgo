import { NextResponse } from "next/server";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { getEstimatedScanDurationMs } from "@/lib/menu-scan-durations";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const imageCount = Math.min(8, Math.max(1, Number(url.searchParams.get("images")) || 1));
  const estimatedMs = await getEstimatedScanDurationMs(imageCount);
  return NextResponse.json({ estimatedMs });
}
