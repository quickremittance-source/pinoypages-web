import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { REMITTANCE_PROVIDERS } from "../src/lib/remittance";

test("remittance compare page lists providers with check-provider, no invented fees", async ({ page }) => {
  const res = await page.goto("/tools/remittance-compare");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Compare remittance providers/i);
  await expect(page.getByTestId("remittance-disclaimer")).toBeVisible();
  await expect(page.getByTestId("remittance-provider")).toHaveCount(REMITTANCE_PROVIDERS.length);
  for (const p of REMITTANCE_PROVIDERS) {
    const card = page.locator(`[data-provider="${p.id}"]`);
    await expect(card).toBeVisible();
    await expect(card.getByTestId("check-provider")).toContainText(/Check with provider/i);
    await expect(card.getByRole("link")).toHaveAttribute("href", p.url);
  }
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\$[0-9]+(\.\d+)?\s*(fee|transfer fee)/i);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test("remittance compare tracks view via __ppEvents", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __ppEvents: unknown[] }).__ppEvents = [];
  });
  await page.goto("/tools/remittance-compare");
  await page.waitForFunction(() => ((window as unknown as { __ppEvents?: unknown[] }).__ppEvents?.length ?? 0) > 0);
  const events = await page.evaluate(() => (window as unknown as { __ppEvents: { name: string }[] }).__ppEvents);
  expect(events.some((e) => e.name === "remittance_compare_view")).toBeTruthy();
});
