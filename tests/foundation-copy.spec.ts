import { test, expect } from "@playwright/test";
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
