import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import guide from "../content/guide.json";
import jsQR from "jsqr";
import { PNG } from "pngjs";

const routes = [...new Set(guide.pages.map((p) => p.route))].concat([
  "/directory",
  "/destinations",
  "/upgrade",
  "/privacy",
  "/listing/tax-02",
]);

for (const path of [...new Set(routes)]) {
  test(`${path} renders and passes axe`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("every printed QR target (with UTM) resolves and canonical drops UTM", async ({ page }) => {
  for (const p of guide.pages.filter((x) => x.section !== "cover")) {
    const res = await page.goto(`${p.route}?utm_source=guide&utm_medium=qr&utm_campaign=x&utm_content=p${p.page}`);
    expect(res?.status(), `page ${p.page}`).toBe(200);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).not.toContain("utm_");
  }
});

test("all 11 ad slots from the shared data render on the site", async ({ page }) => {
  let count = 0;
  for (const r of ["/", "/deadlines", "/directory", "/destinations", "/advertise"]) {
    await page.goto(r);
    count += await page.locator('aside[aria-label^="Ad space"], aside[aria-label^="Advertisement"]').count();
  }
  expect(count).toBe(guide.ads.length);
});

test("HST checker verdicts", async ({ page }) => {
  await page.goto("/tools/hst");
  const q = page.getByLabel(/Quarter \d sales/);
  for (let i = 0; i < 4; i++) await q.nth(i).fill("5000");
  await expect(page.getByRole("status")).toContainText("small supplier");
  await q.nth(0).fill("12000");
  await q.nth(1).fill("12000");
  await expect(page.getByRole("status")).toContainText("must register by the end of the month");
  await q.nth(2).fill("31000");
  await expect(page.getByRole("status")).toContainText("One quarter is over $30,000");
});

test("CPP estimator caps at 2026 maximums", async ({ page }) => {
  await page.goto("/tools/cpp");
  const input = page.getByLabel(/net self-employment income/);
  await input.fill("50000");
  await expect(page.getByTestId("cpp-total")).toContainText("5,533.50");
  await input.fill("200000");
  await expect(page.getByTestId("cpp-total")).toContainText("9,292.90");
});

test("claim flow from a listing validates then succeeds", async ({ page }) => {
  await page.goto("/directory/tax-accounting");
  await page
    .getByRole("link", { name: /Claim or upgrade/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/upgrade\?listing=/);
  await expect(page.getByText("Claiming:")).toBeVisible();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText("Please fix");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Featured").check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("status").first()).toContainText("verify your listing");
});

test("ad inquiry form validates then succeeds", async ({ page }) => {
  await page.goto("/advertise?slot=slot-03");
  await expect(page.getByRole("heading", { name: /space slot-03/ })).toBeVisible();
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText("Please fix");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel(/interested in/).selectOption("full");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("status").first()).toContainText("We received your request");
});

test("security + noindex headers", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["x-robots-tag"]).toContain("noindex");
  expect(h["x-frame-options"]).toBe("DENY");
});

test("unknown routes 404", async ({ page }) => {
  expect((await page.goto("/listing/nope"))?.status()).toBe(404);
  expect((await page.goto("/directory/nope"))?.status()).toBe(404);
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? guide.brand.siteUrl;
function decode(buf: Buffer) {
  const png = PNG.sync.read(buf);
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
}

test("lister QR codes decode to their stable /go/ short link", async ({ request }) => {
  for (const l of guide.listings) {
    const basic = await request.get(`/qr/${l.id}/basic.png`);
    expect(basic.headers()["content-type"]).toBe("image/png");
    expect(decode(await basic.body())).toBe(`${site}/go/${l.id}`);
    const branded = await request.get(`/qr/${l.id}/branded.png`);
    if (l.tier === "free") expect(branded.status()).toBe(404);
    else expect(decode(await branded.body())).toBe(`${site}/go/${l.id}`);
  }
  const pdf = await request.get("/qr/tax-01/branded.pdf");
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  expect(await (await request.get("/qr/tax-01/branded.svg")).text()).toContain("Find us on");
});

test("/go/ short link counts the scan and redirects with UTM", async ({ request }) => {
  const res = await request.get("/go/tax-02", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toMatch(
    /\/listing\/tax-02\?utm_source=own-qr&utm_medium=qr&utm_campaign=lister&utm_content=tax-02$/,
  );
  expect((await request.get("/go/nope", { maxRedirects: 0 })).status()).toBe(404);
});

test("listing page shows the QR section; free tier upsells branded QR", async ({ page }) => {
  await page.goto("/listing/tax-02");
  await expect(page.getByRole("heading", { name: "Your QR code" })).toBeVisible();
  await expect(page.getByRole("img", { name: /QR code for/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /QR Kit \(\$99\/yr, \$79 founding\)/ })).toBeVisible();
  await page.goto("/listing/tax-01");
  await expect(page.getByRole("link", { name: "Print-ready label (PDF)" })).toBeVisible();
});

test("QR Kit is in the shared ad menu, upgrade and advertise pages, and claim form", async ({ page }) => {
  const kit = guide.adMenu.find((a) => a.id === "qrkit")!;
  expect([kit.price, kit.founding]).toEqual([99, 79]);
  for (const id of ["featured", "half", "full"])
    expect(guide.adMenu.find((a) => a.id === id)!.qr).toContain("QR Kit INCLUDED");
  for (const path of ["/upgrade", "/advertise"]) {
    await page.goto(path);
    const row = page.getByRole("row", { name: /QR Kit add-on/ });
    await expect(row).toContainText("$99");
    await expect(row).toContainText("$79");
  }
  await page.goto("/upgrade?listing=tax-03");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("QR Kit", { exact: true }).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("status").first()).toContainText("verify your listing");
});

test("QR Kit listing gets branded files", async ({ request }) => {
  const res = await request.get("/qr/ind-01/branded.png");
  expect(res.status()).toBe(200);
  expect(decode(await res.body())).toBe(`${site}/go/ind-01`);
});
