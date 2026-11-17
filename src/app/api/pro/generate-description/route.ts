import { NextResponse } from "next/server";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { generateBusinessDescription, improveEventDescription } from "@/lib/generate-description";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const keywords = String(body.keywords ?? "").trim();
  const locale = String(body.locale ?? "fr");
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;
  const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : undefined;

  if (!keywords) {
    return NextResponse.json({ error: "Missing keywords" }, { status: 400 });
  }

  const optional = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

  try {
    const description =
      body.kind === "event"
        ? await improveEventDescription(keywords, {
            title: optional(body.title),
            date: optional(body.date),
            place: optional(body.place),
            businessName: name,
          })
        : await generateBusinessDescription(keywords, locale, { name, category });
    return NextResponse.json({ description });
  } catch (err) {
    console.error("generate-description error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
