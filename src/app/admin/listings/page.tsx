import { requireAdmin } from "@/lib/adminGuard";
import type { Metadata } from "next";
import { AdminFrame, NoDb, SyncWarning } from "@/components/admin/AdminFrame";
import { searchListings } from "@/lib/adminEditDb";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin · listings",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type SP = Promise<{ q?: string; status?: string; msg?: string }>;
export default async function Page({ searchParams }: { searchParams: SP }) {
  const { q = "", status = "", msg } = await searchParams;
  await requireAdmin("/admin/listings");
  const rows = await searchListings(
    q.trim().slice(0, 80),
    ["published", "hidden", "archived"].includes(status) ? status : "",
  );
  return (
    <AdminFrame title="Listings" msg={msg}>
      <SyncWarning />
      <form className="flex flex-wrap items-end gap-2" data-testid="listing-search">
        <label className="text-sm">
          Search <input name="q" defaultValue={q} className="field ml-1" placeholder="name, id, area, category" />
        </label>
        <label className="text-sm">
          Status{" "}
          <select name="status" defaultValue={status} className="field ml-1">
            <option value="">Published + hidden</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived (deleted)</option>
          </select>
        </label>
        <button className="btn px-3 py-2 text-sm">Filter</button>
      </form>
      {!rows ? (
        <NoDb />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="listing-table">
            <thead className="bg-[#002050] text-white">
              <tr>
                {["Name", "Category", "Area", "Tier", "Verified", "Status", "Locked", ""].map((h) => (
                  <th key={h} scope="col" className="p-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.listing_id} className="border-b border-[#d0d4dc]">
                  <td className="p-2 font-semibold">{r.name}</td>
                  <td className="p-2">{String(r.category ?? "")}</td>
                  <td className="p-2">{String(r.area ?? "")}</td>
                  <td className="p-2">{String(r.tier)}</td>
                  <td className="p-2">{r.verified ? "yes" : "no"}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.locked ? "locked" : ""}</td>
                  <td className="p-2">
                    <a
                      className="font-bold text-[#0E7C86] underline"
                      href={`/admin/listings/${encodeURIComponent(r.listing_id)}`}
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-[#5b6475]">{rows.length} shown (max 200).</p>
        </div>
      )}
    </AdminFrame>
  );
}
