import { expect, test } from "@playwright/test";
import { normalizeCategory, nonEmptyCategories, publicCategories, withKnownCategory } from "../src/lib/public";
import { categoryAreaCounts } from "../src/components/CategoryAreaCounts";
import { directoryFilterOptions } from "../src/lib/directory";
import type { PublicListing } from "../src/lib/public";

const L = (id: string, category: string): PublicListing =>
  ({ listing_id: id, id, name: id, category, area: "Toronto", tier: "free", verified: false, source: "" }) as PublicListing;

test("Others: missing or unknown categories map to others; known ones are untouched", () => {
  expect(normalizeCategory("food")).toBe("food");
  expect(normalizeCategory("")).toBe("others");
  expect(normalizeCategory(null)).toBe("others");
  expect(normalizeCategory("tax-accounting")).toBe("others");
  expect(normalizeCategory("zzz")).toBe("others");
  expect(withKnownCategory(L("a", "nope")).category).toBe("others");
  expect(publicCategories.at(-1)?.slug).toBe("others");
});

test("empty categories are hidden; Others shows last only when it has listings", () => {
  const some = [L("a", "food"), L("b", "health")];
  expect(nonEmptyCategories(some).map((c) => c.slug)).toEqual(["food", "health"]);
  expect(directoryFilterOptions(some).categories.map((c) => c.value)).toEqual(["food", "health"]);
  const withOthers = [...some, withKnownCategory(L("c", ""))];
  expect(nonEmptyCategories(withOthers).map((c) => c.slug)).toEqual(["food", "health", "others"]);
  expect(categoryAreaCounts(withOthers).categories.map((c) => c.slug)).toEqual(["food", "health", "others"]);
  expect(directoryFilterOptions(withOthers).categories.at(-1)).toEqual({ value: "others", label: "Others" });
});

test("directory and home: no zero-count category tiles, filters only list non-empty categories", async ({ page }) => {
  await page.goto("/directory");
  // Money & Business sub-categories have no public listings (filed at section level), so their tiles are hidden.
  await expect(page.getByTestId("sub-tiles")).toHaveCount(0);
  await expect(page.getByTestId("section-count")).toBeVisible();
  await expect(page.locator("text=/\\b0 listings\\b/")).toHaveCount(0);
  const opts = await page.locator('select[name="category"] option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
  expect(opts).not.toContain("others"); // bundled data has no uncategorised listings
  expect(opts).not.toContain("tax-accounting");
  for (const c of await page.locator("[data-cat]").evaluateAll((e) => e.map((x) => x.getAttribute("data-cat")))) expect(c).not.toBe("others");
  await page.goto("/");
  await expect(page.locator('a[href="/directory/tax-accounting"]')).toHaveCount(0);
});

test("sitemap omits empty sub-category pages", async ({ request }) => {
  const x = await (await request.get("/sitemap.xml")).text();
  expect(x).toContain("/directory/money-business");
  for (const s of ["tax-accounting", "insurance-financial", "business-services", "independents"]) expect(x).not.toContain(`/directory/${s}<`);
});
