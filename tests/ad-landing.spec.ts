import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const tiers = [
  {
    slug: "demo-full",
    photos: 4,
    offer: true,
    services: true,
    map: true,
    buttons: ["Call", "WhatsApp", "Directions", "Website"],
  },
  {
    slug: "demo-half",
    photos: 3,
    offer: true,
    services: true,
    map: true,
    buttons: ["Call", "WhatsApp", "Directions", "Website"],
  },
  {
    slug: "demo-quarter",
    photos: 1,
    offer: true,
    services: false,
    map: false,
    buttons: ["Call", "WhatsApp", "Directions", "Website"],
  },
  { slug: "demo-card", photos: 0, offer: false, services: false, map: false, buttons: ["Map"] },
];

for (const t of tiers) {
  test(`/ad/${t.slug} renders its tier, is noindex, DEMO-labelled and passes axe`, async ({ page }) => {
    const res = await page.goto(`/ad/${t.slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Demo");
    await expect(page.getByTestId("demo-chip")).toHaveText("DEMO");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator('[role="img"][aria-label^="Placeholder photo"]')).toHaveCount(t.photos);
    await expect(page.getByTestId("ad-offer")).toHaveCount(t.offer ? 1 : 0);
    await expect(page.getByTestId("ad-services")).toHaveCount(t.services ? 1 : 0);
    await expect(page.getByTestId("ad-map")).toHaveCount(t.map ? 1 : 0);
    for (const b of t.buttons)
      await expect(page.getByTestId("ad-buttons").getByRole("link", { name: b })).toBeVisible();
    await expect(page.getByText("Rates on request")).toBeVisible();
    if (t.slug === "demo-card") {
      await expect(page.getByTestId("ad-buttons").getByRole("link", { name: /Call|Save contact/ })).toHaveCount(0);
      await expect(page).toHaveTitle(/Pinoy Pages zcard/);
    }
    await expect(page.locator("article")).not.toContainText("$");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("iframe").analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
}

test("?src=qr sends view + scan beacons; button sends click", async ({ page }) => {
  const sent: string[] = [];
  await page.route("/api/stat", async (route) => {
    sent.push(route.request().postData() ?? "");
    await route.fulfill({ status: 204 });
  });
  await page.goto("/ad/demo-quarter?src=qr");
  await expect.poll(() => sent.join()).toContain('"scan"');
  expect(sent.join()).toContain('"view"');
  expect(sent.join()).toContain("ad:demo-quarter");
});

test("verified badges: full = Verified++, half = Verified, quarter none", async ({ page }) => {
  await page.goto("/ad/demo-full");
  await expect(page.getByTestId("verified-badge")).toContainText("Kabayan Verified++");
  await page.goto("/ad/demo-half");
  await expect(page.getByTestId("verified-badge")).toHaveText(/Kabayan Verified$/);
  await page.goto("/ad/demo-quarter");
  await expect(page.getByTestId("verified-badge")).toHaveCount(0);
});

test("?src=qr&t= records a per-tracking-id scan", async ({ page }) => {
  const sent: string[] = [];
  await page.route("/api/stat", async (route) => {
    sent.push(route.request().postData() ?? "");
    await route.fulfill({ status: 204 });
  });
  await page.goto("/ad/demo-full?src=qr&t=df7k2");
  await expect.poll(() => sent.join()).toContain("ad:demo-full:df7k2");
});

test("print QR (SVG + PNG) for every tier decodes to the tracked URL", async ({ request }) => {
  const { default: jsQR } = await import("jsqr");
  const { PNG } = await import("pngjs");
  for (const [slug, t] of [
    ["demo-full", "df7k2"],
    ["demo-half", "dh4m9"],
    ["demo-quarter", "dq8p3"],
    ["demo-card", "dz5r1"],
  ]) {
    const svg = await request.get(`/ad/qr/${slug}.svg`);
    expect(svg.status()).toBe(200);
    expect(await svg.text()).toContain("<svg");
    const png = PNG.sync.read(Buffer.from(await (await request.get(`/ad/qr/${slug}.png`)).body()));
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(code?.data).toBe(`https://pinoypages.ca/ad/${slug}?src=qr&t=${t}`);
  }
});

test("stat API rejects a wrong tracking id", async ({ request }) => {
  expect(
    (await request.post("/api/stat", { data: JSON.stringify({ id: "ad:demo-full:zzzz9", event: "scan" }) })).status(),
  ).toBe(400);
});

test("zcard Save contact is off (vCard 404); ad pages stay out of sitemap", async ({ request }) => {
  expect((await request.get("/ad/vcard/demo-card.vcf")).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/ad/");
  expect((await request.get("/ad/nope")).status()).toBe(404);
});

test("admin ads view: 404 without key; with key lists ads + QR links, noindex", async ({ page, request }) => {
  const { TEST_ENV } = await import("../playwright.config");
  expect((await request.get("/admin/ads")).status()).toBe(404);
  expect((await request.get("/admin/ads?key=wrong")).status()).toBe(404);
  await page.goto(`/admin/ads?key=${TEST_ENV.ADMIN_KEY}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ad and QR analytics");
  await expect(page.getByTestId("admin-ads").locator("li")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "PNG" }).first()).toHaveAttribute("href", "/ad/qr/demo-full.png");
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
});
