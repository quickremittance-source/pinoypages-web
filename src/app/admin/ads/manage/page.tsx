import { requireAdmin } from "@/lib/adminGuard";
import type { Metadata } from "next";
import { AdminFrame, NoDb } from "@/components/admin/AdminFrame";
import { searchAds } from "@/lib/adminEditDb";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin · manage ads",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string; msg?: string }>;
}) {
  const { q = "", show = "", msg } = await searchParams;
  await requireAdmin("/admin/ads/manage");
  const rows = await searchAds(q.trim().slice(0, 80), show);
  return (
    <AdminFrame title="Manage ads" msg={msg}>
      <form className="flex flex-wrap items-end gap-2" data-testid="ad-search">
        <label className="text-sm">
          Search <input name="q" defaultValue={q} className="field ml-1" placeholder="slug or name" />
        </label>
        <label className="text-sm">
          Show{" "}
          <select name="show" defaultValue={show} className="field ml-1">
            <option value="">Current</option>
            <option value="archived">Archived (deleted)</option>
          </select>
        </label>
        <button className="btn px-3 py-2 text-sm">Filter</button>
        <a className="text-sm text-[#0E7C86] underline" href={`/admin/ads`}>
          Ad stats
        </a>
      </form>
      {!rows ? (
        <NoDb />
      ) : (
        <table className="w-full text-left text-sm" data-testid="ad-table">
          <thead className="bg-[#002050] text-white">
            <tr>
              {["Slug", "Name", "Size", "Status", "Dates", "Listing", ""].map((h) => (
                <th key={h} scope="col" className="p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.slug)} className="border-b border-[#d0d4dc]">
                <td className="p-2 font-mono">
                  {String(r.slug)}
                  {r.is_demo ? " (demo)" : ""}
                </td>
                <td className="p-2">{String(r.name ?? "")}</td>
                <td className="p-2">{String(r.tier)}</td>
                <td className="p-2">{String(r.status)}</td>
                <td className="p-2">{[r.start_date, r.end_date].filter(Boolean).join(" → ")}</td>
                <td className="p-2">{String(r.listing_id ?? "")}</td>
                <td className="p-2">
                  <a
                    className="font-bold text-[#0E7C86] underline"
                    href={`/admin/ads/${encodeURIComponent(String(r.slug))}`}
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminFrame>
  );
}
