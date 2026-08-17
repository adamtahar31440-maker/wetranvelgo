import { NextResponse } from "next/server";
import { getAllEstablishments, getCategories } from "@/lib/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const locale = searchParams.get("locale") ?? "fr";

  if (q.length < 2) return NextResponse.json([]);

  const [all, categories] = await Promise.all([getAllEstablishments(), getCategories()]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const matches = all
    .filter((e) => {
      const haystack = [e.name.fr, e.name.en, e.name.ar, e.name[locale] ?? "", e.address ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .slice(0, 6)
    .map((e) => {
      const cat = categoryById.get(e.categoryId);
      const path = cat ? cat.slug : "";
      return {
        id: e.id,
        name: e.name[locale] ?? e.name.fr,
        image: e.images?.[0] ?? null,
        href: `/${locale}/${path}/${e.slug}`,
      };
    });

  return NextResponse.json(matches);
}
