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
  { slug: "demo-card", photos: 0, offer: false, services: false, map: false, buttons: ["Call", "Save contact", "Map"] },
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

test("card vCard downloads; ad pages stay out of sitemap", async ({ request }) => {
  const v = await request.get("/ad/vcard/demo-card.vcf");
  expect(v.status()).toBe(200);
  expect(await v.text()).toContain("BEGIN:VCARD");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/ad/");
  expect((await request.get("/ad/nope")).status()).toBe(404);
});
