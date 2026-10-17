# Yearly print template (annual edition)

The magazine is ONE reusable template, re-issued once a year (e.g. "2027 Edition"); the website is updated year-round.

- Page order, sections, ad slot positions and QR targets live in `content/guide.json` (`pages`, `ads`). Do not change
  page numbers between editions so returning advertisers keep their spot; p.19 is always **Get listed / upgrade**
  (4-tier menu, QR to `/upgrade`).
- Cover shows `brand.editionLabel`; QR UTM campaign = `brand.utmCampaign` (e.g. pera2027).
- Yearly rollover: `npm run new-edition` writes `content/guide.<next>.json` (edition +1, all dates +1 year, sold ads
  marked `renewal`). Review, then replace `guide.json`, run `npm run print:plan` and `npm run check`.
- Renewal outreach in November; on-time = paid by Dec 18. On-time renewals keep the founding price (firm rule) and
  existing members get the member renewal discount (`renewal.memberDiscountPct`, currently 10%).
- Outputs: `print/flatplan.csv`, `print/admenu.csv`, `print/print-data.json`.
