// Generates the PWA / home-screen icons in public/icons from the globe pin of
// the main logo. Run with: node scripts/generate-pwa-icons.mjs
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const OUT = "public/icons";
const TERRACOTTA = "#bf6a45";

// The logo's background is off-white with compression noise, which shows as a
// faint box once upscaled — snap near-white pixels to pure white.
const { data, info } = await sharp("public/logo-wetravelgo.png")
  .extract({ left: 955, top: 40, width: 140, height: 175 })
  .flatten({ background: "#ffffff" })
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += info.channels) {
  if (data[i] > 225 && data[i + 1] > 225 && data[i + 2] > 225) {
    data[i] = data[i + 1] = data[i + 2] = 255;
  }
}
const pin = await sharp(data, { raw: info }).trim().png().toBuffer();

// `pinRatio` = pin height relative to the icon. Maskable icons keep the pin
// inside the 80% safe zone since launchers crop them into circles/squircles.
async function icon(size, { pinRatio, pro = false, file }) {
  const proBand = pro ? Math.round(size * 0.2) : 0;
  const pinHeight = Math.round(size * pinRatio);
  const pinBuf = await sharp(pin)
    .resize({ height: pinHeight, kernel: "lanczos3" })
    .toBuffer();
  const { width: pinWidth } = await sharp(pinBuf).metadata();

  const layers = [
    {
      input: pinBuf,
      left: Math.round((size - pinWidth) / 2),
      top: Math.round((size - pinHeight - proBand) / 2),
    },
  ];
  if (pro) {
    const fontSize = Math.round(size * 0.13);
    const y = Math.round(size * (pinRatio < 0.6 ? 0.82 : 0.86));
    layers.push({
      input: Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
            font-weight="700" font-size="${fontSize}" letter-spacing="${fontSize * 0.08}" fill="${TERRACOTTA}">PRO</text>
        </svg>`
      ),
      left: 0,
      top: 0,
    });
  }

  await sharp({ create: { width: size, height: size, channels: 4, background: "#ffffff" } })
    .composite(layers)
    .png()
    .toFile(`${OUT}/${file}`);
}

await mkdir(OUT, { recursive: true });
for (const pro of [false, true]) {
  const prefix = pro ? "pro-" : "";
  const ratio = pro ? 0.62 : 0.78;
  const maskableRatio = pro ? 0.48 : 0.6;
  await icon(192, { pinRatio: ratio, pro, file: `${prefix}icon-192.png` });
  await icon(512, { pinRatio: ratio, pro, file: `${prefix}icon-512.png` });
  await icon(512, { pinRatio: maskableRatio, pro, file: `${prefix}icon-maskable-512.png` });
  await icon(180, { pinRatio: ratio, pro, file: `${prefix}apple-touch-icon.png` });
}
console.log(`Icons written to ${OUT}`);
