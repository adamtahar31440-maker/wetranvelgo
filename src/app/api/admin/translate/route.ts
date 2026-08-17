import { NextResponse } from "next/server";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { ADMIN_ROLES, type Role } from "@/lib/roles";
import { translateFields } from "@/lib/translate";

export async function POST(req: Request) {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as Role | undefined;
  if (!role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const fields = body.fields as Record<string, string>;
  const locales = body.locales as string[];

  if (!fields || !locales?.length) {
    return NextResponse.json({ error: "Missing fields or locales" }, { status: 400 });
  }

  try {
    const result = await translateFields(fields, locales);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
