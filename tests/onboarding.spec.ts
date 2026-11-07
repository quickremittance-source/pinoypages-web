import { expectAdminGate, login } from "./adminLogin";
import { expect, test } from "@playwright/test";
import { planFor, qrCodeFor, qrTargetFor, verifiedUntil, welcomeDraft } from "../src/lib/onboarding";

const base = { id: 1, name: "Ana", phone: "416", listing_id: null, product: null, payload: {} };
test("planFor maps inquiry kinds", () => {
  expect(planFor({ ...base, kind: "free-listing", business: "Lola's Kitchen", payload: { sub: "food", city: "Toronto" } })).toMatchObject({ type: "listing", mode: "insert", listing_id: "lola-s-kitchen", tier: "free", category: "food" });
  expect(planFor({ ...base, kind: "listing-claim", business: "X", listing_id: "abc", product: "verified" })).toMatchObject({ mode: "update", listing_id: "abc", tier: "verified" });
  expect(planFor({ ...base, kind: "ad-inquiry", business: "Y Co", product: "half" })).toMatchObject({ type: "ad", slug: "y-co", tier: "half" });
  expect(planFor({ ...base, kind: "newsletter-signup", business: null }).type).toBe("none");
});
test("QR targets locked and verified_until is one quarterly issue", () => {
  expect(qrTargetFor("abc")).toBe("https://pinoypages.ca/go/abc");
  expect(() => qrTargetFor("../evil")).toThrow();
  expect(qrCodeFor("Magazine p.12", "abc")).toBe("magazine-p-12-abc");
  expect(verifiedUntil("2026-11-03")).toBe("2027-03-31");
  expect(verifiedUntil("2026-02-10")).toBe("2026-06-30");
});
test("welcome draft: no HST, $199 per issue, badge not purchasable", () => {
  const t = welcomeDraft({ business: "B", cardUrl: "c", statsUrl: null, verified: false });
  expect(welcomeDraft({ business: "B", cardUrl: "c", statsUrl: null, verified: true })).not.toMatch(/QR code:/);
  expect(t).toContain("$199 for the Foundation Edition");
  expect(t).toContain("cannot be bought");
  expect(t).not.toMatch(/HST/);
});
for (const p of ["/admin/inquiries", "/admin/welcome/abc", "/admin/qr-file/abc/qr.png"]) {
  test(`${p} is admin-only`, async ({ request }) => {
    await expectAdminGate(request, p);
    await expectAdminGate(request, `${p}?key=wrong`);
  });
}
test("inquiry queue renders with key, noindex, no DB note", async ({ page }) => {
  await login(page);
  expect((await page.goto("/admin/inquiries"))?.status()).toBe(200);
  await expect(page.getByTestId("no-db")).toBeVisible();
  await expect(page.getByText("update the Brevo record yourself")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
