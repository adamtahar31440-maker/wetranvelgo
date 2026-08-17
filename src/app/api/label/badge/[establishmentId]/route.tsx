import { ImageResponse } from "next/og";
import { adminGetEstablishmentById, getLabelBadges } from "@/lib/admin-data";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ establishmentId: string }> }
) {
  const { establishmentId } = await params;
  const id = Number(establishmentId);
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");

  const [establishment, badges] = await Promise.all([
    adminGetEstablishmentById(id),
    getLabelBadges(id),
  ]);
  if (!establishment) {
    return new Response("Not found", { status: 404 });
  }

  const activeBadges = badges.filter((b) => b.status === "active");
  const badge = yearParam
    ? activeBadges.find((b) => b.year === Number(yearParam))
    : activeBadges.sort((a, b) => b.year - a.year)[0];

  if (!badge) {
    return new Response("No active label for this establishment", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f3a4a 0%, #17495e 60%, #bf6a45 100%)",
          padding: "60px",
        }}
      >
        <div style={{ fontSize: 140, display: "flex" }}>🏆</div>
        <div
          style={{
            marginTop: 20,
            fontSize: 46,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 2,
            textAlign: "center",
            display: "flex",
          }}
        >
          ESSAOUIRA INSIDE
        </div>
        <div
          style={{
            fontSize: 46,
            fontWeight: 700,
            color: "#f4c69a",
            letterSpacing: 2,
            display: "flex",
          }}
        >
          APPROVED {badge.year}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 30,
            color: "#ffffff",
            opacity: 0.85,
            textAlign: "center",
            maxWidth: 800,
            display: "flex",
          }}
        >
          {establishment.name.fr}
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
