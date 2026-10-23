/**
 * Print ad sizes for the 2026–2027 edition (8.5″ × 11″ trim).
 * Full and half page: proposed specs in the Pilot Rate Card (Drive, 00 FINAL).
 * Quarter page and business card: derived from the same 7.5″ × 10″ live area (quarter = half the half page, 0.25″ gutter)
 * and the standard North American business card. All specs are proposed until approved. No rates are approved: "Rates on request".
 */
export type AdSize = {
  id: "full" | "half" | "quarter" | "card";
  name: string;
  size: string;
  note: string;
  /** Position on the 8.5 × 11 page (inches) for the diagram; full page uses the 8.5 × 11 trim. */
  box: { x: number; y: number; w: number; h: number };
  includes: string[];
};

export const RATES_NOTE = "Rates on request";
export const BOOKING_NOTE = "Now booking for the 2026–2027 edition.";

export const adSizes: AdSize[] = [
  {
    id: "full",
    name: "Full page",
    size: "8.5″ × 11″ trim, plus 0.125″ bleed on all sides (8.75″ × 11.25″ document)",
    note: "Keep text and logos inside the 7.5″ × 10″ live area.",
    box: { x: 0, y: 0, w: 8.5, h: 11 },
    includes: [
      "A full page of your own",
      "Your QR code to your Pinoy Pages web page",
      "We can lay it out from your text, logo and photo",
    ],
  },
  {
    id: "half",
    name: "Half page",
    size: "7.5″ × 4.875″ (horizontal), no bleed",
    note: "Sits in the top or bottom half of a directory or magazine page.",
    box: { x: 0.5, y: 5.625, w: 7.5, h: 4.875 },
    includes: [
      "Half a page beside the listings or stories",
      "Your QR code to your Pinoy Pages web page",
      "We can lay it out from your text and logo",
    ],
  },
  {
    id: "quarter",
    name: "Quarter page",
    size: "3.625″ × 4.875″ (vertical), no bleed",
    note: "Runs on a directory or magazine page.",
    box: { x: 4.375, y: 5.625, w: 3.625, h: 4.875 },
    includes: [
      "A quarter of a page",
      "Your QR code to your Pinoy Pages web page",
      "We can lay it out from your text and logo",
    ],
  },
  {
    id: "card",
    name: "Business card",
    size: "3.5″ × 2″ (horizontal), no bleed",
    note: "Runs on a directory page.",
    box: { x: 4.5, y: 8.5, w: 3.5, h: 2 },
    includes: [
      "Your business card, printed in the directory",
      "Your QR code to your Pinoy Pages web page",
      "We can use the card you already have",
    ],
  },
];

export const ARTWORK_SPECS = [
  "PDF/X-1a or PDF/X-4 preferred; high-resolution JPG or PNG also accepted",
  "CMYK colour, images at 300 dpi at final size",
  "Full page only: 0.125″ bleed on all sides, with text kept 0.5″ inside the trim",
  "Fonts embedded or converted to outlines",
  "No artwork? Send your text, logo and photo and we can lay it out for you",
];
