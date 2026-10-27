import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { approvedJobs } from "../src/lib/jobs";

test("job board launches empty with moderation submit form", async ({ page }) => {
  expect(approvedJobs()).toEqual([]);
  const res = await page.goto("/jobs");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Jobs from Pinoy Pages listings/i);
  await expect(page.getByTestId("jobs-empty")).toBeVisible();
  await expect(page.getByTestId("job-submit-form")).toBeVisible();
  // No sample job titles
  await expect(page.getByTestId("jobs-list")).toHaveCount(0);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test("job submit stores pending (never auto-published)", async ({ page }) => {
  await page.goto("/jobs");
  const listing = page.locator('select[name="listingId"] option').nth(1);
  const value = await listing.getAttribute("value");
  expect(value).toBeTruthy();
  await page.selectOption('select[name="listingId"]', value!);
  await page.fill('input[name="title"]', "Part-time Front of House");
  await page.selectOption('select[name="city"]', "GTA");
  await page.fill(
    'textarea[name="description"]',
    "Weekend shifts for a Pinoy Pages listed restaurant. Fixture test only.",
  );
  await page.fill('input[name="applyEmail"]', "hiring@example.com");
  await page.fill('input[name="contactName"]', "Test Owner");
  await page.fill('input[name="contactEmail"]', "owner@example.com");
  await page.check('input[name="consent"]');
  await page.getByRole("button", { name: /Submit a job/i }).click();
  await expect(page.getByTestId("job-submit-success")).toBeVisible();
  // Still empty public list
  await page.goto("/jobs");
  await expect(page.getByTestId("jobs-empty")).toBeVisible();
});
