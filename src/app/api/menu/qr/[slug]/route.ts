import QRCode from "qrcode";
import { getEstablishmentBySlug } from "@/lib/data";
import { hasDigitalCatalog } from "@/lib/digital-menu";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);

  const establishment = await getEstablishmentBySlug(slug);
  if (!establishment || !establishment.menuTranslationEnabled || !hasDigitalCatalog(establishment)) {
    return new Response("Not found", { status: 404 });
  }

  const menuUrl = `${url.origin}/menu/${establishment.slug}`;
  const buffer = await QRCode.toBuffer(menuUrl, { margin: 2, width: 800, errorCorrectionLevel: "M" });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="menu-qr-${establishment.slug}.png"`,
    },
  });
}
