import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("peso converter shows live rate source or unavailable", async ({ page }) => {
  const res = await page.goto("/tools/peso-converter");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Peso converter/i);
  await expect(page.getByTestId("peso-disclaimer")).toBeVisible();
  const rate = page.getByTestId("peso-rate");
  const unavailable = page.getByTestId("peso-unavailable");
  const hasRate = await rate.count();
  const hasUnavail = await unavailable.count();
  expect(hasRate + hasUnavail).toBeGreaterThanOrEqual(1);
  if (hasRate) {
    await expect(rate).toContainText(/1 CAD =/);
    await expect(rate).toContainText(/Source:/);
    await expect(page.getByTestId("peso-cad")).toBeEnabled();
  }
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
