import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getEstablishmentBySlug } from "@/lib/data";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);

  const establishment = await getEstablishmentBySlug(slug);
  if (!establishment || !establishment.menuTranslationEnabled || (establishment.digitalMenu?.length ?? 0) === 0) {
    return new Response("Not found", { status: 404 });
  }

  const menuUrl = `${url.origin}/menu/${establishment.slug}`;
  const qrDataUrl = await QRCode.toDataURL(menuUrl, { margin: 1, width: 480 });

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
          background: "#fdfaf5",
          border: "14px solid #17495e",
          padding: "60px 70px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#bf6a45", display: "flex" }}>
          WETRAVELGO
        </div>

        {establishment.menuPhoto && (
          <div
            style={{
              marginTop: 26,
              display: "flex",
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: "5px solid white",
              boxShadow: "0 0 0 3px #17495e",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={establishment.menuPhoto} width={160} height={160} alt="" style={{ objectFit: "cover" }} />
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            fontSize: 48,
            fontWeight: 700,
            color: "#17495e",
            textAlign: "center",
            display: "flex",
            maxWidth: 780,
          }}
        >
          {establishment.name.fr}
        </div>

        <div style={{ marginTop: 40, display: "flex", padding: 20, background: "white", borderRadius: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={440} height={440} alt="QR" />
        </div>

        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 32, fontWeight: 600, color: "#17495e", display: "flex" }}>
            Scannez pour découvrir
          </div>
          <div style={{ fontSize: 26, color: "#8a8a8a", display: "flex" }}>Scan to discover</div>
          <div style={{ fontSize: 26, color: "#8a8a8a", display: "flex" }}>Escanea para descubrir</div>
        </div>

        <div style={{ marginTop: 70, fontSize: 18, color: "#8a8a8a", display: "flex" }}>
          wetravelgo.com
        </div>
      </div>
    ),
    { width: 1000, height: 1150 }
  );
}
