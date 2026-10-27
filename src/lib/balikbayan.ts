/** Balikbayan box carrier directory. No invented prices — check with each carrier. */
export type BalikbayanCarrier = {
  id: string;
  name: string;
  url: string;
  region: string;
  notes: { en: string; tl: string };
};

/**
 * Official carrier / forwarder pages for Canada → Philippines.
 * Rates are NOT listed here: carriers do not publish a stable machine-readable price list we can fetch.
 */
export const BALIKBAYAN_CARRIERS: BalikbayanCarrier[] = [
  {
    id: "lbc-canada",
    name: "LBC Express (Canada)",
    url: "https://www.lbcexpress.com/ca/shipping-services",
    region: "Canada-wide (branches)",
    notes: {
      en: "Sea and air cargo from Canada. Use LBC's own rate tools or a branch quote — we do not republish fees.",
      tl: "Sea at air cargo mula Canada. Gamitin ang rate tools o sangay ng LBC — hindi namin inuulit ang bayarin.",
    },
  },
  {
    id: "lbc-home",
    name: "LBC Express (rates page)",
    url: "https://www.lbcexpress.com/rates",
    region: "International",
    notes: {
      en: "LBC's rate calculator. Confirm the Canada corridor and box size on their site.",
      tl: "Calculator ng rate ng LBC. Kumpirmahin ang ruta mula Canada at laki ng kahon sa kanilang site.",
    },
  },
  {
    id: "move-for-less",
    name: "Move For Less (Toronto)",
    url: "https://www.moveforless.ca/",
    region: "Toronto / GTA",
    notes: {
      en: "Toronto pickup courier. Ask them for today's box price — figures change and are not copied here.",
      tl: "Courier na may pickup sa Toronto. Tanungin ang kasalukuyang presyo — hindi kinokopya rito ang numero.",
    },
  },
];

/** Government accreditation reference (not a price list). */
export const DTI_ACCREDITED_LIST = {
  name: "DTI-FTEB accredited sea freight forwarders (Canada agents)",
  url: "https://dtiwebfiles.s3.ap-southeast-1.amazonaws.com/FTEB-BLAD/SFFs+and+Foreign+Agents+/2025/06+June/Canada_List+of+Agents.pdf",
  asOf: "2025-06-30",
  notes: {
    en: "Philippine DTI list of accredited sea freight forwarders and their Canada agents. Use it to verify a forwarder — it does not publish consumer box prices.",
    tl: "Listahan ng DTI ng mga accredited sea freight forwarder at ahente sa Canada. Gamitin upang tiyakin ang forwarder — walang presyo ng kahon dito.",
  },
} as const;

export const BALIKBAYAN_COPY = {
  kicker: { en: "Free tool", tl: "Libreng kasangkapan" },
  title: { en: "Balikbayan box carriers", tl: "Mga carrier ng balikbayan box" },
  intro: {
    en: "A directory of carriers that ship boxes from Canada to the Philippines. We do not estimate prices here because carriers do not publish a stable public price feed we can fetch. Always get a quote from the carrier, and prefer DTI-accredited forwarders.",
    tl: "Direktoryo ng mga carrier na nagpapadala ng kahon mula Canada papuntang Pilipinas. Walang tanantya ng presyo dito dahil walang matatag na pampublikong feed ng rate. Kumuha ng quote sa carrier, at unahin ang DTI-accredited forwarders.",
  },
  checkProvider: { en: "Check with provider", tl: "Suriin sa provider" },
  openCarrier: { en: "Open carrier site", tl: "Buksan ang site ng carrier" },
  accredited: { en: "Accreditation reference", tl: "Sanggunian sa akreditasyon" },
  emptyListings: {
    en: "No cargo forwarders are in the Pinoy Pages directory yet. Carriers above are linked from their official sites only.",
    tl: "Wala pang cargo forwarder sa direktoryo ng Pinoy Pages. Ang mga carrier sa itaas ay mula sa kanilang opisyal na site lamang.",
  },
  disclaimer: {
    en: "Disclaimer: Pinoy Pages does not ship boxes and does not publish carrier fees. Third-party blogs and quotes go stale. Confirm size limits, prohibited items, and today's rate with the carrier before you pack.",
    tl: "Paunawa: Hindi nagpapadala ang Pinoy Pages ng kahon at hindi naglalathala ng bayarin. Nagiging luma ang quote sa ibang site. Kumpirmahin ang limitasyon, bawal na gamit, at rate ngayon sa carrier bago magbalot.",
  },
} as const;

export function bi(c: { en: string; tl: string }) {
  return `${c.en} · ${c.tl}`;
}
