export const PESO_COPY = {
  kicker: { en: "Free tool", tl: "Libreng kasangkapan" },
  title: { en: "Peso converter", tl: "Tagapagpalit ng piso" },
  intro: {
    en: "Convert between Canadian dollars and Philippine pesos using a live mid-market rate from a public, keyless API. This is a reference rate — banks and remittance providers add their own spread and fees.",
    tl: "Palitan ang dolyar Canadian at piso gamit ang live mid-market rate mula sa pampublikong API na walang susi. Sanggunian lamang ito — may sariling spread at bayarin ang bangko at padala.",
  },
  cad: { en: "Canadian dollars (CAD)", tl: "Dolyar Canadian (CAD)" },
  php: { en: "Philippine pesos (PHP)", tl: "Piso (PHP)" },
  unavailable: {
    en: "Live rate unavailable right now. Try again shortly, or check a provider quote.",
    tl: "Hindi makuha ang live rate ngayon. Subukan muli, o tingnan ang quote ng provider.",
  },
  disclaimer: {
    en: "Disclaimer: Mid-market rates are not the rate you will get when you send money or exchange cash. Always confirm with your bank or remittance provider.",
    tl: "Paunawa: Hindi ito ang rate sa aktwal na padala o palitan ng pera. Kumpirmahin sa bangko o provider.",
  },
} as const;

export function bi(c: { en: string; tl: string }) {
  return `${c.en} · ${c.tl}`;
}
