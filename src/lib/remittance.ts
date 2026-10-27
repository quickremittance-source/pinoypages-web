/** Remittance CAD→PHP comparison helpers. Never invent fees or rates. */
export type RemittanceProvider = {
  id: string;
  name: string;
  /** Official Canada send page. */
  url: string;
  notes: { en: string; tl: string };
};

/** Providers named in the brief plus common Canada alternatives. Links only — no fees. */
export const REMITTANCE_PROVIDERS: RemittanceProvider[] = [
  {
    id: "remitly",
    name: "Remitly",
    url: "https://www.remitly.com/ca/en/philippines",
    notes: {
      en: "Check the live fee and exchange rate for your amount on Remitly before you send.",
      tl: "Suriin ang kasalukuyang bayarin at exchange rate sa Remitly bago magpadala.",
    },
  },
  {
    id: "wise",
    name: "Wise",
    url: "https://wise.com/ca/send-money/send-money-to-philippines",
    notes: {
      en: "Wise publishes its fee and rate in the quote flow. Confirm there — we do not copy those figures here.",
      tl: "Inilalathala ng Wise ang bayarin at rate sa quote. Kumpirmahin doon — hindi namin kinokopya ang mga numero rito.",
    },
  },
  {
    id: "western-union",
    name: "Western Union",
    url: "https://www.westernunion.com/ca/en/send-money/app/start",
    notes: {
      en: "Fees and rates vary by payout method and corridor. Use Western Union's own calculator.",
      tl: "Nag-iiba ang bayarin at rate ayon sa paraan ng pagtanggap. Gamitin ang calculator ng Western Union.",
    },
  },
  {
    id: "moneygram",
    name: "MoneyGram",
    url: "https://www.moneygram.com/ca/en/send-money",
    notes: {
      en: "Confirm the fee and receive amount on MoneyGram for your payout option.",
      tl: "Kumpirmahin ang bayarin at matatanggap na halaga sa MoneyGram para sa napiling paraan.",
    },
  },
];

export const REMITTANCE_COPY = {
  kicker: { en: "Free tool", tl: "Libreng kasangkapan" },
  title: { en: "Compare remittance providers", tl: "Ihambing ang mga padala" },
  intro: {
    en: "Send Canadian dollars to the Philippines. We list official provider pages and a mid-market reference rate — never invented fees. Always confirm the fee and receive amount with the provider before you pay.",
    tl: "Magpadala ng dolyar Canadian papuntang Pilipinas. Inililista namin ang opisyal na pahina ng bawat provider at isang mid-market reference rate — walang gawa-gawang bayarin. Palaging kumpirmahin ang bayarin at matatanggap na halaga sa provider bago magbayad.",
  },
  midMarket: { en: "Mid-market reference (CAD → PHP)", tl: "Mid-market na sanggunian (CAD → PHP)" },
  checkProvider: { en: "Check with provider", tl: "Suriin sa provider" },
  openProvider: { en: "Open provider quote", tl: "Buksan ang quote ng provider" },
  disclaimer: {
    en: "Disclaimer: Pinoy Pages does not process remittances and does not publish provider fees or locked rates. Figures on provider sites change by amount, speed, and payout method. The mid-market rate is a public reference only; it is not what you will receive after fees. This is general information, not financial advice.",
    tl: "Paunawa: Hindi namamahala ang Pinoy Pages ng padala at hindi naglalathala ng bayarin o nakapirming rate ng provider. Nagbabago ang numero sa site ng provider ayon sa halaga, bilis, at paraan ng pagtanggap. Ang mid-market rate ay sanggunian lamang; hindi iyon ang matatanggap pagkatapos ng bayarin. Impormasyong pangkalahatan ito, hindi payong pinansyal.",
  },
  unavailable: {
    en: "Mid-market rate temporarily unavailable. Use each provider's quote.",
    tl: "Pansamantalang hindi makukuha ang mid-market rate. Gamitin ang quote ng bawat provider.",
  },
} as const;

export function bi(c: { en: string; tl: string }) {
  return `${c.en} · ${c.tl}`;
}
