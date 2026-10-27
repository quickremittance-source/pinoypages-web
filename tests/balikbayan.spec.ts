import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { BALIKBAYAN_CARRIERS, DTI_ACCREDITED_LIST } from "../src/lib/balikbayan";

test("balikbayan directory has carriers, no price estimator, DTI link", async ({ page }) => {
  const res = await page.goto("/tools/balikbayan-box");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Balikbayan box carriers/i);
  await expect(page.getByTestId("no-estimator-notice")).toBeVisible();
  await expect(page.getByTestId("balikbayan-carrier")).toHaveCount(BALIKBAYAN_CARRIERS.length);
  await expect(page.getByTestId("dti-list-link")).toHaveAttribute("href", DTI_ACCREDITED_LIST.url);
  await expect(page.getByTestId("balikbayan-disclaimer")).toBeVisible();
  // No invented per-box prices on the page
  const main = await page.getByTestId("no-estimator-notice").innerText();
  expect(main).toMatch(/unavailable/i);
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\$\s*\d+(\.\d+)?\s*(per box|\/box)/i);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
