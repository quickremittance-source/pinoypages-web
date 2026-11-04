import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminFrame, NoDb } from "@/components/admin/AdminFrame";
import { AuditLog, OpButtons } from "@/components/admin/EditBits";
import { adOpAction, saveAdAction } from "@/app/admin/editActions";
import { validAdminKey } from "@/lib/analytics/token";
import { db } from "@/lib/db";
import { getAd, listingAudit } from "@/lib/adminEditDb";
import { AD_STATUSES, AD_TIERS } from "@/lib/adminEdit";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin · edit ad",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ key?: string; msg?: string }> };
export default async function Page({ params, searchParams }: P) {
  const [{ slug }, { key, msg }] = await Promise.all([params, searchParams]);
  if (!validAdminKey(key)) notFound();
  if (!db())
    return (
      <AdminFrame k={key!} title="Edit ad">
        <NoDb />
      </AdminFrame>
    );
  const a = await getAd(slug);
  if (!a) notFound();
  const audit = await listingAudit("ad", slug);
  const s = (x: unknown) => (x == null ? "" : String(x));
  const archived = a.archived_at != null;
  return (
    <AdminFrame k={key!} title={`Edit ad: ${s(a.name || a.slug)}`} msg={msg}>
      <p className="text-sm">
        slug <code>{s(a.slug)}</code> · status <strong>{s(a.status)}</strong>
        {archived ? " · archived" : ""} ·{" "}
        <a className="text-[#0E7C86] underline" href={`/admin/ads?key=${encodeURIComponent(key!)}`}>
          Ad stats
        </a>
      </p>
      {archived ? (
        <p className="text-sm">Archived ads cannot be edited. Restore it first.</p>
      ) : (
        <form
          action={saveAdAction}
          className="grid gap-3 rounded-lg border border-[#d0d4dc] p-4 sm:grid-cols-2"
          data-testid="edit-ad"
        >
          <input type="hidden" name="key" value={key} />
          <input type="hidden" name="slug" value={s(a.slug)} />
          <label className="text-sm font-semibold">
            Name
            <input name="name" defaultValue={s(a.name)} required className="field mt-1 w-full" />
          </label>
          <label className="text-sm font-semibold">
            Linked listing id
            <input name="listing_id" defaultValue={s(a.listing_id)} className="field mt-1 w-full" />
          </label>
          <label className="text-sm font-semibold">
            Size / slot tier
            <select name="tier" defaultValue={s(a.tier)} className="field mt-1 w-full">
              {AD_TIERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Status (live = active)
            <select name="status" defaultValue={s(a.status)} className="field mt-1 w-full">
              {AD_STATUSES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Start date
            <input type="date" name="start_date" defaultValue={s(a.start_date)} className="field mt-1 w-full" />
          </label>
          <label className="text-sm font-semibold">
            End date
            <input type="date" name="end_date" defaultValue={s(a.end_date)} className="field mt-1 w-full" />
          </label>
          <div className="sm:col-span-2">
            <button className="btn px-4 py-2">Save</button>
          </div>
        </form>
      )}
      <OpButtons
        action={adOpAction}
        k={key!}
        idName="slug"
        id={s(a.slug)}
        archived={archived}
        live={a.status === "live"}
      />
      <AuditLog rows={audit} />
    </AdminFrame>
  );
}
