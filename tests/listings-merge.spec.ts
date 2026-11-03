import { test, expect } from "@playwright/test";
import { fromNeonRow, mergeListings } from "../src/lib/listingsMerge";
import type { PublicListing } from "../src/lib/public";

const base = { category: "tax", area: "Toronto", source: "" };
const file = (id: string, name: string): PublicListing => ({ ...base, listing_id: id, id, name, tier: "free", verified: false });

test.describe("listings merge (unit)", () => {
  test("passes tier/verified through and expires the badge", () => {
    const row = { listing_id: "a", id: "a", name: "A", category: "tax", area: "Toronto", tier: "verified", verified: true, verified_until: "2027-01-01" };
    expect(fromNeonRow(row, "2026-11-03")).toMatchObject({ tier: "verified", verified: true, verified_until: "2027-01-01" });
    expect(fromNeonRow(row, "2027-02-01").verified).toBe(false);
    expect(fromNeonRow({ ...row, verified: false }, "2026-11-03").verified).toBe(false);
  });
  test("keeps bundled listings Neon never saw, skips hidden ones, Neon wins", () => {
    const neon = [{ ...file("a", "A"), tier: "verified", verified: true }];
    const out = mergeListings(neon, [file("a", "A"), file("b", "B"), file("h", "Hidden")], new Set(["a", "h"]));
    expect(out.map((l) => l.listing_id)).toEqual(["a", "b"]);
    expect(out[0]?.verified).toBe(true);
  });
});
