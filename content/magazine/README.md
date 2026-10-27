# Launch content v1: REVIEW NOTES (CONFIDENTIAL DRAFT, nothing published)

Brand: **Pinoy Pages 2026–2027** (working name). Sources checked October 17, 2026.

## Files

| #   | Piece                                   | EN                                 | TL                                 |
| --- | --------------------------------------- | ---------------------------------- | ---------------------------------- |
| 1   | Welcome                                 | 01-welcome.en.md                   | 01-welcome.tl.md                   |
| 2   | 2027 tax deadlines                      | 02-tax-deadlines-2027.en.md        | 02-tax-deadlines-2027.tl.md        |
| 3   | Do I need HST?                          | 03-do-i-need-hst.en.md             | 03-do-i-need-hst.tl.md             |
| 4   | CPP for self-employed                   | 04-cpp-self-employed.en.md         | 04-cpp-self-employed.tl.md         |
| 5   | Newcomer first return checklist         | 05-newcomer-first-tax-return.en.md | 05-newcomer-first-tax-return.tl.md |
| 6   | Benefits families miss                  | 06-benefits-families-miss.en.md    | 06-benefits-families-miss.tl.md    |
| 7   | Choosing a tax preparer                 | 07-choose-tax-preparer.en.md       | 07-choose-tax-preparer.tl.md       |
| 8   | Get listed / upgrade                    | 08-get-listed.en.md                | 08-get-listed.tl.md                |
| 9   | First 30 days in Canada                 | 09-first-30-days.en.md             | 09-first-30-days.tl.md             |
| 10  | First tax return & benefits (MERGED → 05–06; file kept for sources) | 10-first-tax-return-benefits.en.md | 10-first-tax-return-benefits.tl.md |
| 11  | Building credit in Canada               | 11-building-credit.en.md           | 11-building-credit.tl.md           |
| 12  | Caregiver to PR                         | 12-caregiver-to-pr.en.md           | 12-caregiver-to-pr.tl.md           |
| 13  | Sending money home                      | 13-sending-money-home.en.md        | 13-sending-money-home.tl.md        |
| 14  | Balikbayan box shipping                 | 14-balikbayan-box.en.md            | 14-balikbayan-box.tl.md            |
| 15  | Simbang Gabi in Canada                  | 15-simbang-gabi.en.md              | 15-simbang-gabi.tl.md              |
| 16  | Overseas voting (OAV)                   | 16-overseas-voting.en.md           | 16-overseas-voting.tl.md           |
| 17  | Filipino Heritage Month                 | 17-filipino-heritage-month.en.md   | 17-filipino-heritage-month.tl.md   |
| 18  | Business of the Week template           | 18-business-of-the-week-template.en.md | 18-business-of-the-week-template.tl.md |
| –   | Sources index (newcomer series)         | SOURCES-newcomer-series.md         |                                    |
| –   | 6 Facebook group posts (EN + TL)        | social.md                          |                                    |
| –   | Monthly member email template (EN + TL) | email.md                           |                                    |


## Newcomer / community series (pieces 9–18)

- Added as **`draft: true`** in `guide.json`. Production listings and the sitemap omit drafts; Vercel Preview / local `development` / `ALLOW_DRAFTS=true` may show them.
- Every **TL** file is marked **⚠️ NEEDS NATIVE-SPEAKER REVIEW** in frontmatter and opens with a visible draft note (plus an on-page draft banner when rendered).
- **Piece 10** overlapped 05–06 (newcomer return + benefits / CGEB). Unique deltas (CGEB pay-day on the 5th, under-$50 annual lump sum, RC66SCH situations, Automated Benefits Application, fresher source URLs) were merged into 05–06; piece 10 files are kept for provenance and are **not** registered in `guide.json`.
- Primary sources: `SOURCES-newcomer-series.md` (and Sources sections in each piece).

## Must-fix before publishing

1. **All Tagalog** needs native-speaker review.
2. **Placeholders (not yet published by government):**
   - RRSP deadline for the 2026 tax year: shown as _Mon March 1, 2027 (PLACEHOLDER)_. canada.ca still shows only the 2025-year date (March 2, 2026).
   - CCB, Canada Groceries and Essentials Benefit, and Ontario Trillium Benefit amounts for **July 2027 to June 2028** (based on 2026 returns): not published. Articles show the current July 2026 to June 2027 amounts and say so.
   - **CWB:** $1,665 / $2,869 / $860 are from the CRA benefits infographic (updated July 1, 2026). The CRA "How much you can get" page still shows 2025 amounts. Confirm these are 2026 tax-year figures.
3. **Name change found:** the GST/HST credit was renamed the **Canada Groceries and Essentials Benefit** in July 2026 (plus a 25% increase for 2026 to 2031). The content uses the new name with "formerly the GST/HST credit".
4. **Tool URLs** (/tools/hst-checker, /tools/cpp-estimator, /tax-deadlines) are placeholders [URL TBC]. These routes are not in the web repo zip (pinoypages-web_2026-10-16_e60ddc4). /advertise and /advertise#get-listed do exist.
5. **Piece 8 [confirm] items:** the founding deadline (Fri Dec 18, 2026, taken from the lister templates and platform plan), the Featured feature list (from the lister templates), the founding-price lock on renewal, and whether tax is extra. **Conflict:** `src/data/rates.ts` in the web repo shows half page $375 / full page $650, but the brief says $450 / $850. The content uses the brief's prices.
6. Worked examples (CPP, HST) are illustrative arithmetic on official figures, with made-up incomes. They are labelled as examples.
