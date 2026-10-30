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
| 8   | Get listed / upgrade                    | 08-get-listed.en.md                | (retired; falls back to English)   |
| –   | 6 Facebook group posts (EN + TL)        | social.md                          |                                    |
| –   | Monthly member email template (EN + TL) | email.md                           |                                    |

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
