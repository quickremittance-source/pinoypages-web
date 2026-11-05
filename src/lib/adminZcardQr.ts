import "server-only";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const NAVY = { dark: "#002050", light: "#FFFFFF" } as const;

/** Print-ready PNG with a readable quiet zone (margin 4 modules). */
export function zcardQrPng(url: string) {
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "Q",
    margin: 4,
    width: 1200,
    color: NAVY,
  });
}

/** Small print sheet: branded QR plus the destination URL and label. */
export async function zcardQrPdf(url: string, name: string, label: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${name} ZCard QR`);
  const page = doc.addPage([216, 288]);
  const png = await doc.embedPng(await zcardQrPng(url));
  page.drawImage(png, { x: 18, y: 78, width: 180, height: 180 });
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const navy = rgb(0, 32 / 255, 80 / 255);
  const white = rgb(1, 1, 1);
  page.drawRectangle({ x: 0, y: 0, width: 216, height: 70, color: navy });
  const title = name.slice(0, 40);
  page.drawText(title, { x: 108 - bold.widthOfTextAtSize(title, 10) / 2, y: 52, size: 10, font: bold, color: white });
  const cap = (label || "ZCard QR").slice(0, 48);
  page.drawText(cap, { x: 108 - reg.widthOfTextAtSize(cap, 8) / 2, y: 36, size: 8, font: reg, color: white });
  const short = url.replace(/^https?:\/\//, "");
  const size = short.length > 42 ? 6 : 7;
  page.drawText(short, { x: 108 - reg.widthOfTextAtSize(short, size) / 2, y: 18, size, font: reg, color: white });
  return doc.save();
}
