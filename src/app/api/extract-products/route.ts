import { NextResponse } from "next/server";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { extractProductsFromImages } from "@/lib/extract-products";

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const images = body.images as { mediaType: string; base64: string }[] | undefined;
  if (!images?.length) return NextResponse.json({ error: "Missing images" }, { status: 400 });
  if (images.length > 5) return NextResponse.json({ error: "Too many images" }, { status: 400 });
  if (!images.every((img) => ALLOWED_MEDIA_TYPES.has(img.mediaType) && img.base64)) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  try {
    const items = await extractProductsFromImages(
      images as { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; base64: string }[]
    );
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Product extraction error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
