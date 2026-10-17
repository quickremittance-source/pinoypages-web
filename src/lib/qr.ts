import "server-only";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { abs, brand, listings } from "@/lib/guide";

/** Stable short URL printed in every lister's own QR. /go/ logs the scan, then redirects with UTM tags. */
export const goUrl = (id: string) => abs(`/go/${id}`);
export const isPaid = (id: string) => listings.find((l) => l.id === id)?.tier !== "free";
const SEA = "#0B5E7A";

export async function qrSvg(id: string, branded: boolean) {
  const svg = await QRCode.toString(goUrl(id), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: branded ? SEA : "#000000", light: "#FFFFFF" },
  });
  if (!branded) return svg;
  // Branded: add a caption band under the code with the brand and short link.
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const size = Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1] ?? 33);
  const h = size + 8;
  const short = goUrl(id).replace(/^https?:\/\//, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${h}" shape-rendering="crispEdges">${inner}<rect x="0" y="${size}" width="${size}" height="8" fill="${SEA}"/><text x="${size / 2}" y="${size + 3.4}" font-family="Arial, sans-serif" font-size="2.6" font-weight="700" fill="#fff" text-anchor="middle">Find us on ${escapeXml(brand.name)}</text><text x="${size / 2}" y="${size + 6.6}" font-family="Arial, sans-serif" font-size="2.1" fill="#fff" text-anchor="middle">${escapeXml(short)}</text></svg>`;
}

export function qrPng(id: string, branded: boolean) {
  return QRCode.toBuffer(goUrl(id), {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 16,
    color: { dark: branded ? SEA : "#000000", light: "#FFFFFF" },
  });
}

/** Print-ready 3" x 3.5" PDF label: branded QR (1" quiet-zone safe at 2.5" wide) + caption. */
export async function qrPdf(id: string, name: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${name} QR code`);
  const page = doc.addPage([216, 252]);
  const png = await doc.embedPng(await qrPng(id, true));
  page.drawImage(png, { x: 18, y: 54, width: 180, height: 180 });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({ x: 0, y: 0, width: 216, height: 48, color: rgb(11 / 255, 94 / 255, 122 / 255) });
  const t1 = `Find us on ${brand.name}`;
  page.drawText(t1, { x: 108 - font.widthOfTextAtSize(t1, 11) / 2, y: 28, size: 11, font, color: rgb(1, 1, 1) });
  const t2 = goUrl(id).replace(/^https?:\/\//, "");
  page.drawText(t2, { x: 108 - reg.widthOfTextAtSize(t2, 8) / 2, y: 13, size: 8, font: reg, color: rgb(1, 1, 1) });
  return doc.save();
}

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
