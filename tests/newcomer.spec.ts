import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CHECKLIST_ITEMS } from "../src/lib/newcomer";

test("newcomer checklist renders phases, gov links, localStorage progress", async ({ page }) => {
  const res = await page.goto("/tools/newcomer-checklist");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/90-day newcomer checklist/i);
  await expect(page.getByTestId("checklist-item")).toHaveCount(CHECKLIST_ITEMS.length);
  await expect(page.getByTestId("checklist-privacy")).toBeVisible();
  // All item links are canada.ca (or subordinate)
  for (const item of CHECKLIST_ITEMS) {
    await expect(page.locator(`[data-item="${item.id}"] a`)).toHaveAttribute("href", item.href);
    expect(item.href).toMatch(/^https:\/\/www\.canada\.ca\//);
  }
  await page.getByTestId("check-sin").check();
  await expect(page.getByTestId("checklist-progress")).toContainText(`1 / ${CHECKLIST_ITEMS.length}`);
  await page.reload();
  await expect(page.getByTestId("check-sin")).toBeChecked();
  await page.getByTestId("checklist-reset").click();
  await expect(page.getByTestId("check-sin")).not.toBeChecked();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
