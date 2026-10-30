// Local preview screenshots (not part of the build). Usage: node scripts/screenshots.mjs [baseUrl] [outDir]
import { chromium, devices } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3300";
const out = process.argv[3] ?? "/workspace/previews";
const shots = [
  { name: "site-home", path: "/", device: "desktop" },
  { name: "site-home-mobile", path: "/", device: "mobile" },
  { name: "site-directory", path: "/directory", device: "desktop" },
  { name: "site-directory-mobile", path: "/directory/tax-accounting", device: "mobile" },
  { name: "site-listing", path: "/listing/tax-01", device: "desktop" },
  { name: "site-zcard-mobile", path: "/card/tax-01", device: "mobile" },
  { name: "site-get-verified", path: "/get-verified", device: "desktop" },
  { name: "site-awards", path: "/awards", device: "desktop" },
  { name: "site-report-mobile", path: "/report/tax-01", device: "mobile" },
  { name: "site-magazine", path: "/magazine", device: "desktop" },
  { name: "site-article", path: "/magazine/welcome", device: "desktop" },
  { name: "site-listing-rich", path: "/listing/tax-01", device: "desktop" },
  { name: "site-calendar", path: "/calendar", device: "desktop" },
  { name: "site-calendar-month", path: "/calendar?view=month&m=2026-11", device: "desktop" },
  { name: "site-event", path: "/calendar/ev-file-2027", device: "desktop" },
  { name: "site-list-free", path: "/list-free", device: "desktop" },
  { name: "site-ideas", path: "/magazine/ideas", device: "desktop" },
  { name: "site-home-mobile-cta", path: "/directory/tax-accounting", device: "mobile", viewportOnly: true },
];
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
for (const s of shots) {
  const ctx = await browser.newContext(
    s.device === "mobile"
      ? { ...devices["Pixel 7"] }
      : { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 },
  );
  const page = await ctx.newPage();
  await page.goto(base + s.path, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${s.name}.png`, fullPage: !s.viewportOnly });
  console.log("saved", `${out}/${s.name}.png`);
  await ctx.close();
}
await browser.close();
