import { test, expect } from "@playwright/test";

test("explore home is noindex, shows drafts with AI-labelled notes and only the $99 price", async ({ page }) => {
  const res = await page.goto("/explore?src=qr");
  expect(res?.status()).toBe(200);
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator("h1")).toContainText("Balikbayan Explorer");
  await expect(page.getByTestId("draft-badge").first()).toContainText("Draft – under review");
  const text = await page.locator("main").innerText();
  expect((text.match(/\$\d+/g) ?? []).every((x) => x === "$99")).toBe(true);
  expect(text).toContain("Rates on request");
});

test("topic and video pages render with youtube-nocookie embed", async ({ page }) => {
  for (const t of ["travel", "remittance", "padala"]) {
    expect((await page.goto(`/explore/${t}`))?.status(), t).toBe(200);
  }
  const res = await page.goto("/explore/videos/IXUjEuR357U");
  expect(res?.status()).toBe(200);
  expect(res?.headers()["content-security-policy"]).toContain("frame-src https://www.youtube-nocookie.com");
  await expect(page.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/IXUjEuR357U/);
  expect((await page.goto("/explore/videos/notarealid"))?.status()).toBe(404);
});
