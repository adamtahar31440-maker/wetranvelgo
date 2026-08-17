import { NextResponse } from "next/server";
import { getConditionsFor, LOCATIONS } from "@/lib/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location");
  if (!LOCATIONS.some((l) => l.id === locationId)) {
    return NextResponse.json({ error: "Unknown location" }, { status: 400 });
  }
  const conditions = await getConditionsFor(locationId!);
  return NextResponse.json(conditions);
}
