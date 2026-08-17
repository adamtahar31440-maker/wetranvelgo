import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { adminGetEstablishmentById, getLabelBadges, getLabelEvaluationById } from "@/lib/admin-data";

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

  const evaluation = badge.evaluationId ? await getLabelEvaluationById(badge.evaluationId) : null;
  const verificationUrl = `${url.origin}/fr/approved/${establishment.slug}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 220 });

  const awardedDate = badge.awardedAt
    ? new Date(badge.awardedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fdfaf5",
          border: "16px solid #17495e",
          padding: "70px 90px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#bf6a45", letterSpacing: 2, display: "flex" }}>
              CERTIFICAT OFFICIEL
            </div>
            <div style={{ fontSize: 44, fontWeight: 700, color: "#17495e", marginTop: 8, display: "flex" }}>
              Essaouira Inside Approved {badge.year}
            </div>
          </div>
          <div style={{ fontSize: 90, display: "flex" }}>🏆</div>
        </div>

        <div style={{ marginTop: 60, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, color: "#8a8a8a", display: "flex" }}>Décerné à</div>
          <div style={{ fontSize: 52, fontWeight: 700, color: "#17495e", marginTop: 6, display: "flex" }}>
            {establishment.name.fr}
          </div>
        </div>

        <div style={{ marginTop: 50, display: "flex", gap: 80 }}>
          {evaluation && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 20, color: "#8a8a8a", display: "flex" }}>Score obtenu</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#17495e", display: "flex" }}>
                {evaluation.totalScore}/100
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 20, color: "#8a8a8a", display: "flex" }}>Date d&apos;attribution</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: "#17495e", display: "flex" }}>{awardedDate}</div>
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, color: "#8a8a8a", display: "flex" }}>
              N° {badge.certificateNumber ?? `EIA-${badge.year}-${String(establishment.id).padStart(4, "0")}`}
            </div>
            <div style={{ marginTop: 20, fontSize: 26, fontStyle: "italic", color: "#17495e", display: "flex" }}>
              Signature officielle — Essaouira Inside
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={130} height={130} alt="QR" />
        </div>
      </div>
    ),
    { width: 1600, height: 1131 }
  );
}
