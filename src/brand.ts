/**
 * Pinoy Pages brand: single source of truth.
 * Values from the official brand sheet (PinoyPages_Brand-Sheet_2026-11-03.pdf, Hana's handoff, Drive).
 * CSS mirrors these as --color-* tokens in src/app/globals.css (Tailwind v4 @theme).
 */
export const colors = {
  navy: { hex: "#002050", name: "PinoyPages Navy", use: "Wordmark, headers" },
  blue: { hex: "#1068C0", name: "Philippine Blue", use: "Pin, links" },
  red: { hex: "#E01820", name: "Philippine Red", use: "Pin, headlines" },
  gold: { hex: "#F8B838", name: "Sun Gold", use: "Sun, banners (decorative only, never body text on white)" },
  seaTeal: { hex: "#00B0C0", name: "Sea Teal", use: "Sea, accents, large areas" },
  teal: { hex: "#0E7C86", name: "Deep Teal (working shade)", use: "Verified badge, small text" },
  green: { hex: "#3C8A3C", name: "Palm Green", use: "Palms, nature" },
  cream: { hex: "#F8F8D8", name: "Book Cream", use: "Book pages, fills" },
  white: { hex: "#FFFFFF", name: "White", use: "Base background" },
} as const;

export const fontStack = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const tagline = "Find your kabayan in business.";

export const logos = [
  { file: "/brand/pinoypages-logo-horizontal.png", name: "Horizontal lockup" },
  { file: "/brand/pinoypages-logo-full.png", name: "Full colour lockup" },
  { file: "/brand/pinoypages-logo-stacked-jovi.png", name: "Stacked lockup (Jovi)" },
  { file: "/brand/pinoypages-mark.png", name: "Mark" },
] as const;

export const icons = [
  { file: "/brand/icon-512.png", name: "App icon 512" },
  { file: "/brand/icon-192.png", name: "App icon 192" },
  { file: "/brand/apple-touch-icon.png", name: "Apple touch icon" },
  { file: "/brand/favicon-32.png", name: "Favicon 32" },
  { file: "/brand/icon-badge-verified-kabayan.png", name: "Verified Kabayan badge" },
  { file: "/brand/icon-sun.png", name: "Gold sun" },
  { file: "/brand/icons/icon-home.svg", name: "Home (nav)" },
] as const;
