import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import travel from "../content/travel.json";
import creditsJson from "../content/travel-credits.json";

const dests = travel.destinations;
const credits = creditsJson.credits;
const ALLOWED = /^(Public domain|CC0.*|CC BY(-SA)? \d\.\d( [A-Z]{2})?)$/;
const words = (d: (typeof dests)[number]) =>
  [...d.guide, d.bestSeason, d.gettingThere, d.tip].join(" ").split(/\s+/).filter(Boolean).length;
type Ev = Record<string, string | number>;

test.describe("travel data", () => {
  test("every destination has a full guide, season, route and tip, and both hubs are populated", () => {
    expect(dests.filter((d) => d.hub === "gta").length).toBe(16);
    expect(dests.filter((d) => d.hub === "abroad").length).toBe(11);
    for (const d of dests) {
      const n = words(d);
      expect(n, d.slug).toBeGreaterThanOrEqual(150);
      expect(n, d.slug).toBeLessThanOrEqual(300);
      expect(d.bestSeason && d.gettingThere && d.tip, d.slug).toBeTruthy();
      expect(Array.isArray(d.reviewNeeded), d.slug).toBe(true);
    }
  });

  test("copy has no prices", () => {
    const all = JSON.stringify(travel);
    expect(all).not.toMatch(/[$₱€£]\s?\d|\bPHP\s?\d|\bCAD\s?\d|\bUSD\s?\d/);
  });

  test("every photo is a real licensed file with source, author and licence", () => {
    for (const c of credits) {
      expect(c.licence, c.slug).toMatch(ALLOWED);
      expect(c.source, c.slug).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(c.author.length, c.slug).toBeGreaterThan(0);
      expect(c.file, c.slug).toMatch(/^\/travel\/[a-z0-9-]+\.webp$/);
      expect(existsSync(path.join("public", c.file)), c.slug).toBe(true);
      expect(readFileSync(path.join("public", c.file)).subarray(8, 12).toString(), c.slug).toBe("WEBP");
    }
    const withPhoto = new Set(credits.map((c) => c.slug));
    for (const d of dests) expect(withPhoto.has(d.slug) || creditsJson.noPhoto.includes(d.slug), d.slug).toBe(true);
  });
});

test.describe("travel pages", () => {
  test("hub shows both hubs as postcards, lazy images, credits and noindex", async ({ page }) => {
    const res = await page.goto("/travel");
    expect(res?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.getByRole("heading", { name: "GTA & Nearby" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "From the GTA" })).toBeVisible();
    await expect(page.locator("[data-hub] [data-postcard]")).toHaveCount(dests.length);
    const imgs = page.locator('[data-hub] [data-postcard] img[src^="/travel/"]');
    await expect(imgs).toHaveCount(credits.length);
    expect(await imgs.first().getAttribute("loading")).toBe("lazy");
    for (const slug of creditsJson.noPhoto) {
      await expect(page.locator(`[data-hub] [data-postcard="${slug}"]`)).toHaveAttribute("data-has-photo", "false");
    }
    await expect(page.locator("#credits [data-testid=photo-credit]")).toHaveCount(credits.length);
    expect(await page.title()).toContain("Day Trips from Toronto");
  });

  test("postcard_click fires with destination params", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __ppEvents: unknown[] }).__ppEvents = [];
    });
    await page.goto("/travel");
    const card = page.locator('[data-hub="gta"] [data-postcard="niagara-falls"]');
    await card.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
    await card.click();
    const evs = await page.evaluate(() => (window as unknown as { __ppEvents: Ev[] }).__ppEvents);
    const ev = evs.find((e) => e.name === "postcard_click")!;
    expect(ev).toMatchObject({ destination: "niagara-falls", hub: "gta", placement: "travel-hub-gta" });
    expect(typeof ev.position).toBe("number");
  });

  test("Manila page: SEO title, guide sections, JSON-LD, credit, related listings", async ({ page }) => {
    await page.goto("/travel/manila");
    expect(await page.title()).toContain("Toronto to Manila Travel Guide");
    for (const id of ["best-season", "getting-there", "pinoy-tip"]) await expect(page.getByTestId(id)).toBeVisible();
    await expect(page.getByTestId("travel-hero").locator("img[src^='/travel/']")).toHaveAttribute(
      "src",
      "/travel/manila.webp",
    );
    await expect(page.getByTestId("travel-hero").getByTestId("photo-credit")).toContainText("CC BY");
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const place = ld
      .map((t) => JSON.parse(t))
      .find((j) => j["@type"] === "Place" || j["@type"] === "TouristAttraction");
    expect(place?.name).toBe("Manila");
    expect(place?.geo?.["@type"]).toBe("GeoCoordinates");
    const links = page.getByTestId("travel-related").locator('a[href^="/business/"]');
    expect(await links.count()).toBeGreaterThan(0);
    await expect(page.getByTestId("travel-related")).not.toContainText(/Verified/);
  });

  test("GTA page uses TouristAttraction and a Day Trip title", async ({ page }) => {
    await page.goto("/travel/niagara-falls");
    expect(await page.title()).toContain("Day Trip from Toronto");
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
    expect(ld.some((j) => j["@type"] === "TouristAttraction")).toBe(true);
  });

  test("plain postcard renders with no photo for Little Manila", async ({ page }) => {
    await page.goto("/travel/little-manila");
    await expect(page.getByTestId("travel-hero").getByTestId("plain-postcard")).toBeVisible();
    await expect(page.getByTestId("travel-hero").locator("img[src^='/travel/']")).toHaveCount(0);
  });

  test("Featured travel slot: permanent id, Rates on request, no prices, ad_click params", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __ppEvents: unknown[] }).__ppEvents = [];
    });
    await page.goto("/travel/boracay");
    const slot = page.locator('[data-slot-id="travel-boracay-featured-1"]');
    await expect(slot).toBeVisible();
    await expect(slot.getByTestId("travel-rates")).toHaveText("Rates on request");
    expect(await slot.innerText()).not.toMatch(/\$\s?\d/);
    const link = slot.getByRole("link");
    await link.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
    await link.click();
    const evs = await page.evaluate(() => (window as unknown as { __ppEvents: Ev[] }).__ppEvents);
    const ev = evs.find((e) => e.name === "ad_click")!;
    expect(ev).toMatchObject({ ad_id: "travel-boracay-featured-1", placement: "travel-featured", slot_position: 1 });
    for (const k of ["advertiser_id", "business_id", "campaign", "start_date", "end_date"]) expect(k in ev).toBe(true);
  });

  test("homepage and category pages carry the postcard accent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("travel-strip").locator("[data-postcard]")).toHaveCount(3);
    await page.goto("/directory/money-business");
    await expect(page.getByTestId("travel-strip")).toBeVisible();
  });

  test("sitemap lists /travel and every destination", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/travel</loc>");
    for (const d of dests) expect(xml, d.slug).toContain(`/travel/${d.slug}</loc>`);
  });
});
