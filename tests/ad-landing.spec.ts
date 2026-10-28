import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { TEST_ENV } from "../playwright.config";

const landing = [
  { slug: "demo-full", photos: 4, buttons: ["Call", "WhatsApp", "Directions", "Website"] },
  { slug: "demo-half", photos: 3, buttons: ["Call", "WhatsApp", "Directions", "Website"] },
];

for (const t of landing) {
  test(`/ad/${t.slug} landing page: noindex, DEMO-labelled, no prices, passes axe`, async ({ page }) => {
    const res = await page.goto(`/ad/${t.slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Demo");
    await expect(page.getByTestId("demo-chip")).toHaveText("DEMO");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await expect(page.locator('[role="img"][aria-label^="Placeholder photo"]')).toHaveCount(t.photos);
    await expect(page.getByTestId("ad-offer")).toHaveCount(1);
    await expect(page.getByTestId("ad-services")).toHaveCount(1);
    await expect(page.getByTestId("ad-map")).toHaveCount(1);
    for (const b of t.buttons)
      await expect(page.getByTestId("ad-buttons").getByRole("link", { name: b })).toBeVisible();
    await expect(page.getByRole("link", { name: "Save contact" })).toHaveCount(0);
    await expect(page.getByText("Rates on request")).toBeVisible();
    await expect(page.locator("article")).not.toContainText("$");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("iframe").analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
}

test("quarter and zcard have no landing page: they redirect to the listing (or /directory)", async ({ request }) => {
  for (const slug of ["demo-quarter", "demo-card"]) {
    const r = await request.get(`/ad/${slug}?src=qr`, { maxRedirects: 0 });
    expect([302, 307]).toContain(r.status());
    expect(r.headers()["location"]).toMatch(/\/directory$|\/listing\//);
  }
});

test("full page ?src=qr&t= sends view, scan and per-tracking-id scan beacons", async ({ page }) => {
  const sent: string[] = [];
  await page.route("/api/stat", async (route) => {
    sent.push(route.request().postData() ?? "");
    await route.fulfill({ status: 204 });
  });
  await page.goto("/ad/demo-full?src=qr&t=df7k2");
  await expect.poll(() => sent.join()).toContain("ad:demo-full:df7k2");
  expect(sent.join()).toContain('"view"');
  expect(sent.join()).toContain('"scan"');
});

test("verified badges: full = Verified++, half = Verified", async ({ page }) => {
  await page.goto("/ad/demo-full");
  await expect(page.getByTestId("verified-badge")).toContainText("Kabayan Verified++");
  await page.goto("/ad/demo-half");
  await expect(page.getByTestId("verified-badge")).toHaveText(/Kabayan Verified$/);
});

test("full and half landing pages carry powered-by-zcard branding, no extra prices", async ({ page }) => {
  for (const slug of ["demo-full", "demo-half"]) {
    await page.goto(`/ad/${slug}`);
    await expect(page.getByTestId("powered-by-zcard")).toContainText("powered by zcard");
    await expect(page.locator("[data-brand=zcard]")).toBeVisible();
    const body = (await page.locator("body").innerText()).replace(/\$99/g, "");
    expect(body).not.toMatch(/\$\d/);
  }
});

test("print QR decodes to the tracked URL; zcard has no QR without Verified++", async ({ request }) => {
  const { default: jsQR } = await import("jsqr");
  const { PNG } = await import("pngjs");
  for (const [slug, t] of [
    ["demo-full", "df7k2"],
    ["demo-half", "dh4m9"],
    ["demo-quarter", "dq8p3"],
  ]) {
    const svg = await request.get(`/ad/qr/${slug}.svg`);
    expect(svg.status()).toBe(200);
    expect(await svg.text()).toContain("<svg");
    const png = PNG.sync.read(Buffer.from(await (await request.get(`/ad/qr/${slug}.png`)).body()));
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(code?.data).toBe(`https://pinoypages.ca/ad/${slug}?src=qr&t=${t}`);
  }
  expect((await request.get("/ad/qr/demo-card.png")).status()).toBe(404);
  expect((await request.get("/ad/qr/demo-card.svg")).status()).toBe(404);
});

test("stat API rejects a wrong tracking id", async ({ request }) => {
  const r = await request.post("/api/stat", { data: JSON.stringify({ id: "ad:demo-full:zzzz9", event: "scan" }) });
  expect(r.status()).toBe(400);
});

test("vCard off (404); ad pages stay out of sitemap; unknown ad 404", async ({ request }) => {
  expect((await request.get("/ad/vcard/demo-card.vcf")).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/ad/");
  expect((await request.get("/ad/nope")).status()).toBe(404);
});

test("admin ads view: 404 without key; with key lists ads, QR links and redirects, noindex", async ({
  page,
  request,
}) => {
  expect((await request.get("/admin/ads")).status()).toBe(404);
  expect((await request.get("/admin/ads?key=wrong")).status()).toBe(404);
  await page.goto(`/admin/ads?key=${TEST_ENV.ADMIN_KEY}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ad and QR analytics");
  await expect(page.getByTestId("admin-ads").locator("li")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "PNG" })).toHaveCount(3);
  await expect(page.getByText("redirects to /directory").first()).toBeVisible();
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
});
