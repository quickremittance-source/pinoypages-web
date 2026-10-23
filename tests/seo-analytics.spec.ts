import { test, expect } from "@playwright/test";
import pub from "../content/public-listings.json";
import { activeAds, ads, type AdDef } from "../src/lib/ads";

const withPhone = pub.listings.find((l) => (l as { phone?: string }).phone && (l as { address?: string }).address)!;
const slug = withPhone.id.replace(/^pub-/, "");

test("business page: unique title, description, LocalBusiness JSON-LD from real data only, noindex", async ({
  page,
}) => {
  const res = await page.goto(`/business/${slug}`);
  expect(res?.status()).toBe(200);
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page).toHaveTitle(
    new RegExp(`^${withPhone.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} – .+, .*Toronto$`),
  );
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!);
  expect(ld["@type"]).toBe("LocalBusiness");
  expect(ld.name).toBe(withPhone.name);
  expect(ld.geo).toBeUndefined();
  expect(ld.openingHours).toBeUndefined();
});

test("listing events fire with business_id, business_name, category", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __ppEvents: unknown[] }).__ppEvents = [];
  });
  await page.goto(`/business/${slug}?utm_campaign=founding&utm_source=qr&utm_medium=flyer`);
  await page
    .locator('[data-track="click_call"]')
    .evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
  await page.locator('[data-track="click_call"]').click();
  const evs = await page.evaluate(() => (window as unknown as { __ppEvents: Record<string, string>[] }).__ppEvents);
  const view = evs.find((e) => e.name === "listing_view")!;
  expect(view.business_id).toBe(withPhone.id);
  const call = evs.find((e) => e.name === "click_call")!;
  expect(call.business_name).toBe(withPhone.name);
  expect(call.category).toBeTruthy();
  expect(call.campaign).toBe("founding");
  expect(call.ctx_medium).toBe("flyer");
});

test("/q/<code> redirects to the listing with QR UTMs; unknown code 404s", async ({ request }) => {
  const r = await request.get(`/q/ws-${slug}`, { maxRedirects: 0 });
  expect(r.status()).toBe(302);
  const loc = new URL(r.headers()["location"]!);
  expect(loc.pathname).toBe(`/business/${slug}`);
  expect(loc.searchParams.get("utm_source")).toBe("qr");
  expect(loc.searchParams.get("utm_medium")).toBe("window-sticker");
  expect(loc.searchParams.get("utm_campaign")).toBe("founding");
  expect((await request.get(`/q/zz-${slug}`, { maxRedirects: 0 })).status()).toBe(404);
});

test("landing page, sitemap and robots stay noindex", async ({ page, request }) => {
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain(`/business/${slug}`);
  const m = /<loc>https?:\/\/[^/<]+\/(filipino-[a-z0-9-]+)<\/loc>/.exec(sm)!;
  const res = await page.goto(`/${m[1]}`);
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText(/Filipino/);
  expect((await request.get("/filipino-restaurants-nowhere")).status()).toBe(404);
  expect(await (await request.get("/robots.txt")).text()).toMatch(/Disallow: \/\s/);
});

test("ad config holds no ads; slots render nothing; date window filtering works", async ({ page }) => {
  expect(ads).toEqual([]);
  await page.goto("/");
  await expect(page.locator("[data-ad]")).toHaveCount(0);
  const ex: AdDef = {
    ad_id: "x",
    business_id: "b",
    placement: "banner",
    campaign: "c",
    start_date: "2026-11-01",
    end_date: "2026-11-30",
    headline: "h",
    href: "/",
  };
  expect(activeAds("banner", { now: new Date("2026-11-15") }, [ex])).toHaveLength(1);
  expect(activeAds("banner", { now: new Date("2026-12-01") }, [ex])).toHaveLength(0);
});
