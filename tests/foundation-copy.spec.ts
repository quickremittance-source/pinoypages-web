import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import publicListings from "../content/public-listings.json";
import guide from "../content/guide.json";
import { bizPath } from "../src/lib/seo";

const retired = /everything included|monthly scan report|scan counts reported monthly|ZCard completed on the call|April 16, 2027|short-run proof copy|Verification gets you customers|\$99\.50|\$199 per issue/i;
for (const route of ["/get-verified", "/advertise", "/terms", "/list-free", "/classic", bizPath(publicListings.listings[0]!)]) {
  test(`Foundation offer has no retired bundle promises on ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toContainText(retired);
    await expect(page.locator("body")).toContainText("Foundation Edition");
    await expect(page.locator("body")).toContainText("$199");
  });
}
test("Foundation terms retain agreed print, archive, identity and legal safeguards", async ({ page }) => {
  await page.goto("/terms");
  const body = page.locator("body");
  await expect(body).toContainText(/six-month pilot/i);
  await expect(body).toContainText(/100 memberships/i);
  await expect(body).toContainText(/mailed to businesses/i);
  await expect(body).toContainText(/archived and remain available to view/i);
  await expect(body).toContainText(/payment never buys the badge/i);
  await expect(body).toContainText(/ID is viewed, never stored/i);
  await expect(body).toContainText(/Draft terms, to be reviewed by a lawyer before launch/i);
  expect(guide.brand.badgeRule).not.toContain("ZCard completed");
});

test("legacy ZCard URL offers only the approved photo landing-page upgrade", async ({ page }) => {
  await page.goto("/zcard");
  const body = page.locator("body");
  await expect(body).not.toContainText(/Rates on request|Sponsored search placement|Half page ad|Quarter page ad|shared across the Pinoy Pages family|planned for a later release/i);
  await expect(body).toContainText(/standard ad landing page with one photo/i);
  await expect(body).toContainText(/price on enquiry/i);
  await expect(body).toContainText(/six-month pilot/i);
  await expect(page.getByRole("link", { name: "Ask about a landing page" })).toHaveAttribute("href", "/advertise?product=landing-photo#enquire");
});

test("private results copy does not sell unconfirmed membership reporting", () => {
  const source = readFileSync("src/app/results/[id]/page.tsx", "utf8");
  expect(source).not.toMatch(/Upgrade to see your monthly views and clicks|Upgrade to see your results/);
  expect(source).toContain("Reporting access is not confirmed as part of the Foundation membership offer.");
  expect(source).toContain("!validResultsToken(id, t)");
});


test("membership article follows the approved Foundation offer", () => {
  const article = readFileSync("content/magazine/08-get-listed.en.md", "utf8");
  expect(article).not.toMatch(/quarterly|four seasons|4 seasons|99\.50|199 per issue|ZCard completed on the call|report your scan count every month|Print ads.*now booking|shown before tax/i);
  expect(article).toMatch(/six-month pilot/);
  expect(article).toMatch(/100 memberships/);
  expect(article).toMatch(/mailed to businesses/);
  expect(article).toMatch(/standard.*landing page.*one photo/i);
  expect(article).toMatch(/price on enquiry/i);
  expect(article).toContain("DRAFT — CONFIDENTIAL — not for publication");
});

test("membership prices keep CAD and no-HST facts without before-tax wording", () => {
  const paths = ["content/guide.json", "src/components/PlanTable.tsx", "src/components/GetVerified.tsx", "src/app/terms/page.tsx"];
  for (const path of paths) {
    const source = readFileSync(path, "utf8");
    expect(source, path).not.toMatch(/shown before tax/i);
    expect(source, path).toMatch(/no HST/i);
  }
  expect(guide.brand.annualNote).toContain("CAD");
});
