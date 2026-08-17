import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { extractMenuFromImages } from "@/lib/extract-menu";
import { recordScanDuration } from "@/lib/menu-scan-durations";

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Same auth model as /api/extract-products: any logged-in user, not gated on
  // an existing professional/establishment record. This is also used from the
  // signup form itself, before that record exists yet.
  const body = await req.json();
  const images = body.images as { mediaType: string; base64: string }[] | undefined;
  if (!images?.length) return NextResponse.json({ error: "Missing images" }, { status: 400 });
  if (images.length > 8) return NextResponse.json({ error: "Too many images" }, { status: 400 });
  if (!images.every((img) => ALLOWED_MEDIA_TYPES.has(img.mediaType) && img.base64)) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  try {
    const startedAt = Date.now();
    const items = await extractMenuFromImages(
      images as { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; base64: string }[]
    );
    waitUntil(recordScanDuration(images.length, Date.now() - startedAt));
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Menu extraction error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
