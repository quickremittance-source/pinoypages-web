import { requireAdmin } from "@/lib/adminGuard";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminFrame, NoDb, SyncWarning } from "@/components/admin/AdminFrame";
import { AuditLog, OpButtons } from "@/components/admin/EditBits";
import { listingOpAction, saveListingAction } from "@/app/admin/editActions";
import { db } from "@/lib/db";
import { getListing, listingAudit } from "@/lib/adminEditDb";
import { LISTING_STATUSES, LISTING_TIERS } from "@/lib/adminEdit";
import { publicCategories } from "@/lib/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin · edit listing",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type P = { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> };
export default async function Page({ params, searchParams }: P) {
  const [{ id }, { msg }] = await Promise.all([params, searchParams]);
  await requireAdmin(`/admin/listings/${encodeURIComponent(id)}`);
  if (!db())
    return (
      <AdminFrame title="Edit listing">
        <NoDb />
      </AdminFrame>
    );
  const l = await getListing(id);
  if (!l) notFound();
  const audit = await listingAudit("listing", id);
  const s = (x: unknown) => (x == null ? "" : String(x));
  const archived = l.status === "archived";
  return (
    <AdminFrame title={`Edit listing: ${s(l.name)}`} msg={msg}>
      {Boolean(l.from_brevo) && <SyncWarning />}
      <p className="text-sm">
        id <code>{s(l.listing_id)}</code> · status <strong>{s(l.status)}</strong>
        {l.locked ? " · locked (manual override)" : ""} ·{" "}
        <a className="text-[#0E7C86] underline" href={`/admin/qr`}>
          QR stats
        </a>
      </p>
      {archived ? (
        <p className="text-sm">Archived listings cannot be edited. Restore it first.</p>
      ) : (
        <form
          action={saveListingAction}
          className="grid gap-3 rounded-lg border border-[#d0d4dc] p-4 sm:grid-cols-2"
          data-testid="edit-listing"
        >
          <input type="hidden" name="listing_id" value={s(l.listing_id)} />
          {(
            [
              ["name", "Name"],
              ["area", "Area"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["address", "Address"],
              ["website", "Website"],
            ] as const
          ).map(([n, label]) => (
            <label key={n} className="text-sm font-semibold">
              {label}
              <input name={n} defaultValue={s(l[n])} className="field mt-1 w-full" required={n === "name"} />
            </label>
          ))}
          <label className="text-sm font-semibold">
            Category
            <select name="category" defaultValue={s(l.category)} className="field mt-1 w-full">
              <option value="">(none)</option>
              {publicCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              {l.category && !publicCategories.some((c) => c.slug === l.category) ? (
                <option value={s(l.category)}>{s(l.category)}</option>
              ) : null}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Tier
            <select name="tier" defaultValue={s(l.tier)} className="field mt-1 w-full">
              {LISTING_TIERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Status
            <select name="status" defaultValue={s(l.status)} className="field mt-1 w-full">
              {LISTING_STATUSES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Verified until
            <input type="date" name="verified_until" defaultValue={s(l.verified_until)} className="field mt-1 w-full" />
          </label>
          <label className="text-sm">
            <input type="checkbox" name="verified" defaultChecked={Boolean(l.verified)} /> Verified (live video identity
            check passed)
          </label>
          <label className="text-sm">
            <input type="checkbox" name="locked" defaultChecked /> Locked: manual override, the Brevo sync skips this
            listing
          </label>
          <div className="sm:col-span-2">
            <button className="btn px-4 py-2">Save</button>
          </div>
        </form>
      )}
      <OpButtons
        action={listingOpAction}
       
        idName="listing_id"
        id={s(l.listing_id)}
        archived={archived}
        live={l.status === "published"}
      />
      <AuditLog rows={audit} />
    </AdminFrame>
  );
}
