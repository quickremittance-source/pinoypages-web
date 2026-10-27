/** 90-day newcomer checklist. Official government links only; progress is localStorage-only. */
export type ChecklistItem = {
  id: string;
  phase: "days-1-7" | "days-8-30" | "days-31-90";
  title: { en: string; tl: string };
  detail: { en: string; tl: string };
  href: string;
  source: string;
};

export const CHECKLIST_PHASES = [
  { id: "days-1-7" as const, en: "Days 1–7", tl: "Araw 1–7" },
  { id: "days-8-30" as const, en: "Days 8–30", tl: "Araw 8–30" },
  { id: "days-31-90" as const, en: "Days 31–90", tl: "Araw 31–90" },
];

/** Steps with official Canada / provincial sources. No invented advice. */
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "sin",
    phase: "days-1-7",
    title: { en: "Apply for a Social Insurance Number (SIN)", tl: "Mag-apply ng Social Insurance Number (SIN)" },
    detail: {
      en: "You need a SIN to work and to access government benefits. Apply online or in person through Service Canada.",
      tl: "Kailangan ang SIN para magtrabaho at makakuha ng benepisyo. Mag-apply online o personal sa Service Canada.",
    },
    href: "https://www.canada.ca/en/employment-social-development/services/sin/apply.html",
    source: "Government of Canada — Service Canada",
  },
  {
    id: "ircc-account",
    phase: "days-1-7",
    title: { en: "Create or sign in to your IRCC account", tl: "Gumawa o mag-sign in sa IRCC account" },
    detail: {
      en: "Use your IRCC secure account for status documents, applications, and messages from Immigration, Refugees and Citizenship Canada.",
      tl: "Gamitin ang IRCC account para sa mga dokumento, aplikasyon, at mensahe mula sa Immigration, Refugees and Citizenship Canada.",
    },
    href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html",
    source: "IRCC",
  },
  {
    id: "health-card-on",
    phase: "days-1-7",
    title: { en: "Apply for provincial health coverage", tl: "Mag-apply ng provincial health coverage" },
    detail: {
      en: "Health insurance is provincial. Ontario newcomers: apply for OHIP. Other provinces have their own enrolment pages — start from Canada.ca's health care overview.",
      tl: "Probinsiya ang health insurance. Sa Ontario: mag-apply ng OHIP. May sariling pahina ang ibang probinsiya — magsimula sa overview sa Canada.ca.",
    },
    href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/new-life-canada/enrol-health-care.html",
    source: "IRCC — Enrol in health care",
  },
  {
    id: "bank",
    phase: "days-8-30",
    title: { en: "Open a bank account", tl: "Magbukas ng bank account" },
    detail: {
      en: "The Financial Consumer Agency of Canada explains how to open an account and what ID banks usually ask for.",
      tl: "Ipinapaliwanag ng Financial Consumer Agency of Canada kung paano magbukas ng account at anong ID ang karaniwang hinihingi.",
    },
    href: "https://www.canada.ca/en/financial-consumer-agency/services/banking/bank-accounts.html",
    source: "FCAC",
  },
  {
    id: "cra-itn",
    phase: "days-8-30",
    title: { en: "Get ready for taxes (CRA)", tl: "Maghanda sa buwis (CRA)" },
    detail: {
      en: "Learn how tax filing works for newcomers and when you may need an Individual Tax Number if you do not have a SIN yet.",
      tl: "Alamin ang paghahain ng buwis para sa mga bagong dating at kung kailan kailangan ang Individual Tax Number kung wala pang SIN.",
    },
    href: "https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html",
    source: "Canada Revenue Agency",
  },
  {
    id: "settlement",
    phase: "days-8-30",
    title: { en: "Find free settlement services", tl: "Maghanap ng libreng settlement services" },
    detail: {
      en: "IRCC-funded settlement organizations help with language classes, job search, and everyday orientation.",
      tl: "Tumutulong ang settlement organizations na suportado ng IRCC sa wika, trabaho, at oryentasyon sa araw-araw.",
    },
    href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/new-life-canada/services.html",
    source: "IRCC — Settlement services",
  },
  {
    id: "drivers",
    phase: "days-31-90",
    title: { en: "Exchange or apply for a driver's licence", tl: "Magpalit o mag-apply ng driver's licence" },
    detail: {
      en: "Licences are issued by your province or territory. Start from the national overview, then follow your province's steps.",
      tl: "Probinsiya o teritoryo ang nagbibigay ng lisensya. Magsimula sa pambansang overview, sunod ang hakbang sa inyong probinsiya.",
    },
    href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/new-life-canada/drive.html",
    source: "IRCC — Driving in Canada",
  },
  {
    id: "credentials",
    phase: "days-31-90",
    title: { en: "Get foreign credentials assessed", tl: "Ipasuri ang dayuhang kredensyal" },
    detail: {
      en: "If you plan to work in a regulated occupation, find how to have your education and experience assessed.",
      tl: "Kung regulated ang propesyon, alamin kung paano ipasuri ang edukasyon at karanasan mula sa ibang bansa.",
    },
    href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/prepare-life-canada/prepare-work/credential-assessment.html",
    source: "IRCC — Credential assessment",
  },
  {
    id: "benefits",
    phase: "days-31-90",
    title: { en: "Check benefits you may be eligible for", tl: "Suriin ang mga benepisyong maaaring makukuha" },
    detail: {
      en: "Use the federal benefits finder and provincial pages to see programs for families, workers, and newcomers.",
      tl: "Gamitin ang federal benefits finder at pahina ng probinsiya para sa programa para sa pamilya, manggagawa, at bagong dating.",
    },
    href: "https://www.canada.ca/en/services/benefits.html",
    source: "Government of Canada — Benefits",
  },
];

export const STORAGE_KEY = "pp_newcomer_checklist_v1";

export const NEWCOMER_COPY = {
  kicker: { en: "Free tool", tl: "Libreng kasangkapan" },
  title: { en: "90-day newcomer checklist", tl: "90-araw na checklist para sa bagong dating" },
  intro: {
    en: "A practical checklist for your first three months in Canada. Progress stays on this device only (localStorage) — we do not upload it. Every link goes to an official government page.",
    tl: "Praktikal na checklist para sa unang tatlong buwan sa Canada. Sa device na ito lang naka-save ang progreso (localStorage) — hindi namin ina-upload. Opisyal na pahina ng gobyerno ang bawat link.",
  },
  progress: { en: "Progress", tl: "Progreso" },
  reset: { en: "Clear progress on this device", tl: "Burahin ang progreso sa device na ito" },
  openSource: { en: "Official source", tl: "Opisyal na sanggunian" },
  privacy: {
    en: "Your checkmarks never leave this browser. Clearing site data or using another device starts fresh.",
    tl: "Hindi umaalis sa browser ang iyong mga checkmark. Kapag binura ang site data o gumamit ng ibang device, maguumpisa ulit.",
  },
} as const;

export function bi(c: { en: string; tl: string }) {
  return `${c.en} · ${c.tl}`;
}
