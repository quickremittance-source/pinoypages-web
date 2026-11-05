import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminFrame, NoDb } from "@/components/admin/AdminFrame";
import { isAdmin } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { listAdminZcards } from "@/lib/adminZcardDb";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin · ZCards",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

/** Private index of full-page ZCard ads (ads.tier = zcard). */
export default async function Page({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  if (!(await isAdmin())) notFound();
  const rows = await listAdminZcards();
  return (
    <AdminFrame title="ZCard ads" msg={msg}>
      <p className="text-sm text-[#5b6475]">
        Full-page ZCard ads with QR tracking. Listing users do not see this page. Linking a listing here is optional.
      </p>
      {!db() && <NoDb />}
      {rows.length === 0 ? (
        <p className="rounded border border-[#d0d4dc] p-4" data-testid="zcard-empty">
          No ZCard ads yet. When one is created it will show up here.
        </p>
      ) : (
        <div className="overflow-x-auto" role="region" aria-label="ZCard ads" tabIndex={0}>
          <table className="w-full text-left text-sm" data-testid="zcard-table">
            <thead className="bg-[#002050] text-white">
              <tr>
                {["Name", "Slug", "Status", "Listing", "QR codes", "Scans", ""].map((h) => (
                  <th key={h} scope="col" className="p-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug} className="border-b border-[#d0d4dc]" data-slug={r.slug}>
                  <th scope="row" className="p-2 font-semibold">
                    {r.name}
                    {r.demo ? " (demo)" : ""}
                  </th>
                  <td className="p-2 font-mono">{r.slug}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.listingId ?? "Not linked"}</td>
                  <td className="p-2 tabular-nums">{r.qrCount ?? "—"}</td>
                  <td className="p-2 tabular-nums">{r.scans ?? "—"}</td>
                  <td className="p-2">
                    <a
                      className="font-bold text-[#0E7C86] underline"
                      href={`/admin/zcard/${encodeURIComponent(r.slug)}`}
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminFrame>
  );
}
