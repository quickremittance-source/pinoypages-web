import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import foodMeta from "../content/food-meta.json";
import foodTagSources from "../content/food-tag-sources.json";
import {
  DISH_TAGS,
  classifyFoodType,
  filterFoodListings,
  foodListings,
  hasKnownHours,
  isMenuStale,
  isOpenNow,
  parseFoodFilters,
  unclassifiedFoodAdjacent,
  type FoodListing,
  type WeeklyHours,
} from "../src/lib/food";
import { publicListings } from "../src/lib/public";

/** Fixture listing — tests only. Never written to content files. */
function fixture(overrides: Partial<FoodListing> = {}): FoodListing {
  return {
    listing_id: "pub-test-fiesta-kitchen",
    id: "pub-test-fiesta-kitchen",
    name: "Test Fiesta Kitchen",
    category: "food",
    area: "North York",
    tier: "free",
    verified: false,
    source: "https://example.com/fixture",
    address: "100 Test St",
    foodType: "restaurant",
    dishTags: [],
    featuredDishes: [],
    effectiveTier: "free",
    ...overrides,
  };
}

test("every dish tag in food-meta has a recorded source URL", () => {
  const sources = foodTagSources.listings as Record<string, { tags: Record<string, { url: string }> }>;
  for (const [id, m] of Object.entries(foodMeta.listings as Record<string, { dishTags?: string[] }>)) {
    for (const t of m.dishTags ?? []) {
      expect((DISH_TAGS as readonly string[]).includes(t)).toBe(true);
      expect(sources[id]?.tags[t]?.url, `${id}:${t}`).toMatch(/^https?:\/\//);
    }
  }
});

test("classifies food and groceries; reports food-adjacent outside those categories", () => {
  const all = foodListings();
  expect(all.length).toBeGreaterThan(0);
  expect(all.every((l) => l.category === "food" || l.category === "groceries")).toBe(true);
  expect(all.some((l) => l.dishTags.length > 0)).toBe(true);
  expect(all.every((l) => !l.verified)).toBe(true);

  const byType = Object.fromEntries(
    (["restaurant", "bakery", "grocery", "caterer"] as const).map((t) => [
      t,
      all.filter((l) => l.foodType === t).length,
    ]),
  );
  expect(byType.restaurant).toBeGreaterThan(0);
  expect(byType.grocery).toBe(7);
  expect(byType.bakery).toBe(7);
  expect(byType.caterer).toBe(2);

  const bakery = publicListings.find((l) => l.name === "Manila Bakery");
  expect(bakery && classifyFoodType(bakery)).toBe("bakery");
  const grocery = publicListings.find((l) => l.category === "groceries");
  expect(grocery && classifyFoodType(grocery)).toBe("grocery");

  const unc = unclassifiedFoodAdjacent();
  expect(unc.map((u) => u.listing_id)).toContain("pub-tummy-fillers-catering-balloon-decor");
});

test("dish tag list is the controlled set; filters never invent tags", () => {
  expect(DISH_TAGS).toContain("lechon");
  expect(DISH_TAGS).toContain("ube");
  const f = parseFoodFilters({ city: "North York", type: "restaurant", dish: "adobo", open: "1" });
  expect(f).toEqual({ city: "North York", type: "restaurant", dish: "adobo", open: true });
  expect(parseFoodFilters({ dish: "pizza" }).dish).toBe("");
  expect(parseFoodFilters({ type: "cafe" }).type).toBe("");

  const withTag = fixture({ dishTags: ["adobo"] });
  const without = fixture({ listing_id: "x", dishTags: [] });
  expect(filterFoodListings([withTag, without], { city: "", type: "", dish: "adobo", open: false })).toEqual([
    withTag,
  ]);
});

test("open-now requires known hours; menu stale after 90 days", () => {
  const hours: WeeklyHours = {
    mon: { open: "09:00", close: "17:00" },
    tue: { open: "09:00", close: "17:00" },
    wed: { open: "09:00", close: "17:00" },
    thu: { open: "09:00", close: "17:00" },
    fri: { open: "09:00", close: "17:00" },
    sat: null,
    sun: null,
  };
  const openable = fixture({ hours });
  expect(hasKnownHours(openable)).toBe(true);
  expect(hasKnownHours(fixture())).toBe(false);
  // Fixed Monday 2026-10-26 12:00 America/Toronto = 16:00Z
  const mondayNoon = new Date("2026-10-26T16:00:00Z");
  expect(isOpenNow(openable, mondayNoon)).toBe(true);
  const mondayNight = new Date("2026-10-26T23:00:00Z");
  expect(isOpenNow(openable, mondayNight)).toBe(false);

  expect(isMenuStale(undefined)).toBe(false);
  expect(isMenuStale("2026-10-01T00:00:00Z", new Date("2026-10-26T00:00:00Z"))).toBe(false);
  expect(isMenuStale("2026-01-01T00:00:00Z", new Date("2026-10-26T00:00:00Z"))).toBe(true);
});

test("/food renders real listings, bilingual copy, sourced dish tags, and passes axe", async ({ page }) => {
  const res = await page.goto("/food");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Filipino Foodie Finder/i);
  await expect(page.getByTestId("food-list")).toBeVisible();
  await expect(page.getByTestId("food-count")).toContainText(/\d+ places?/);
  await expect(page.getByTestId("food-suggest-form")).toBeVisible();
  expect(await page.getByTestId("dish-tag").count()).toBeGreaterThan(0);
  await page.goto("/food?dish=lechon");
  await expect(page.getByTestId("food-count")).toContainText(/\d+ places?/);
  expect(await page.getByTestId("dish-tag").filter({ hasText: /^lechon$/i }).count()).toBeGreaterThan(0);
  // Open-now hidden when no listing has hours
  await expect(page.getByLabel(/Open now/i)).toHaveCount(0);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test("/food filters via query params (server-side)", async ({ page }) => {
  await page.goto("/food?city=North%20York&type=bakery");
  await expect(page).toHaveURL(/city=North/);
  await expect(page.getByTestId("food-filters")).toBeVisible();
  const cards = page.locator("[data-food-type]");
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(cards.nth(i)).toHaveAttribute("data-food-type", "bakery");
    await expect(cards.nth(i)).toHaveAttribute("data-city", "North York");
  }
});

test("/food?type=grocery shows groceries only", async ({ page }) => {
  await page.goto("/food?type=grocery");
  const cards = page.locator("[data-food-type=grocery]");
  expect(await cards.count()).toBe(7);
  expect(await page.locator("[data-food-type=restaurant]").count()).toBe(0);
});

test("suggest form honeypot short-circuits; valid submit succeeds", async ({ page }) => {
  await page.goto("/food");
  const form = page.getByTestId("food-suggest-form");
  await form.scrollIntoViewIfNeeded();
  await expect(form).toBeVisible();
  await form.locator('input[name="website_url"]').evaluate((el: HTMLInputElement) => {
    el.value = "https://spam.example";
  });
  await form.locator('input[name="name"]').fill("Spam");
  await form.locator('button[type="submit"]').click();
  await expect(form.getByRole("status")).toContainText(/Thanks/i);

  await page.goto("/food");
  const form2 = page.getByTestId("food-suggest-form");
  await form2.scrollIntoViewIfNeeded();
  await expect(form2).toBeVisible();
  const firstListing = await form2.locator('select[name="listing_id"] option').nth(1).getAttribute("value");
  expect(firstListing).toBeTruthy();
  await form2.locator('select[name="listing_id"]').selectOption(firstListing!);
  await form2.locator('input[name="dishTags"][value="adobo"]').check();
  await form2.locator('input[name="name"]').fill("Jose Test");
  await form2.locator('input[name="email"]').fill("owner@example.com");
  await form2.locator('input[name="consent"]').check();
  await form2.locator('button[type="submit"]').click();
  await expect(form2.getByRole("status")).toContainText(/Salamat|received your update/i);
});

test("food page stays noindex", async ({ page }) => {
  await page.goto("/food");
  // Next may emit both page-level and layout robots tags.
  const contents = await page.locator('meta[name="robots"]').evaluateAll((els) =>
    els.map((e) => e.getAttribute("content") ?? ""),
  );
  expect(contents.some((c) => /noindex/i.test(c))).toBe(true);
});
