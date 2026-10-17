import "server-only";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { abs, brand, isPaid as paidTier, isVerified, listingById, longDate } from "@/lib/guide";

/** Stable short URL printed in every lister's own QR. /go/ logs the scan, then redirects with UTM tags. */
export const goUrl = (id: string) => abs(`/go/${id}`);
export const isPaid = (id: string) => paidTier(listingById(id));
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

/**
 * QR counter card (every Verified listing): 4" x 6" portrait for a shop counter or desk. Full-bleed design so a
 * sticker swap is obvious; carries the badge only if earned, plus the QR-hygiene line.
 */
export async function counterPdf(id: string) {
  const l = listingById(id)!;
  const doc = await PDFDocument.create();
  doc.setTitle(`${l.name} counter card`);
  const page = doc.addPage([288, 432]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const red = rgb(200 / 255, 16 / 255, 46 / 255);
  const teal = rgb(14 / 255, 124 / 255, 134 / 255);
  const white = rgb(1, 1, 1);
  const center = (t: string, y: number, size: number, f = bold, color = white) =>
    page.drawText(t, { x: 144 - f.widthOfTextAtSize(t, size) / 2, y, size, font: f, color });
  page.drawRectangle({ x: 0, y: 0, width: 288, height: 432, color: red });
  for (let i = -432; i < 288; i += 14)
    page.drawLine({ start: { x: i, y: 0 }, end: { x: i + 432, y: 432 }, thickness: 0.6, color: rgb(0.86, 0.3, 0.38) });
  center(brand.name.toUpperCase(), 398, 11);
  const fit = (t: string, max: number) => {
    let size = 18;
    while (size > 9 && bold.widthOfTextAtSize(t, size) > max) size -= 1;
    return size;
  };
  center(l.name, 372, fit(l.name, 250));
  page.drawRectangle({ x: 54, y: 156, width: 180, height: 196, color: white });
  const png = await doc.embedPng(await qrPng(id, true));
  page.drawImage(png, { x: 62, y: 178, width: 164, height: 164 });
  center(goUrl(id).replace(/^https?:\/\//, ""), 163, 8, reg, teal);
  center("Scan to save our contact", 132, 13);
  if (isVerified(l)) {
    page.drawRectangle({ x: 64, y: 92, width: 160, height: 28, color: white });
    center("VERIFIED KABAYAN", 107, 10, bold, red);
    center(`Verified ${longDate(l.verifiedOn!)}`, 96, 7, reg, red);
  }
  page.drawRectangle({ x: 0, y: 0, width: 288, height: 76, color: teal });
  center("Check the preview says pinoypages.ca before you tap.", 50, 8.5);
  center("We never ask for logins, payments or personal info.", 36, 7.5, reg);
  center(brand.zcardMark, 16, 7.5, reg);
  return doc.save();
}

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
