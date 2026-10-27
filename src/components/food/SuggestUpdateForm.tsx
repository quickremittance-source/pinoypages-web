"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitFoodUpdate, type FormState } from "@/app/actions";
import { DISH_TAGS, FOOD_COPY, bi, type FoodListing } from "@/lib/food";

const init: FormState = { status: "idle" };

function Utm() {
  const sp = useSearchParams();
  return <input type="hidden" name="utm_source" value={sp.get("utm_source") ?? ""} />;
}

export function SuggestUpdateForm({ listings }: { listings: Pick<FoodListing, "listing_id" | "id" | "name" | "effectiveTier">[] }) {
  const [s, action, pending] = useActionState(submitFoodUpdate, init);
  const fe = s.status === "error" ? s.fieldErrors : undefined;
  const paid = listings.some((l) => l.effectiveTier === "business_card" || l.effectiveTier === "premium");

  return (
    <form
      id="suggest-update"
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6"
      noValidate
      data-testid="food-suggest-form"
    >
      {s.status !== "idle" && (
        <p
          role={s.status === "error" ? "alert" : "status"}
          className={`rounded-lg p-3 font-bold ${s.status === "error" ? "bg-sand text-coral-dk" : "bg-aqua text-sea"}`}
        >
          {s.message}
        </p>
      )}
      <p className="text-sm text-muted">
        Owners can suggest dish tags and a menu link. Every suggestion waits for review — nothing is published
        automatically. {FOOD_COPY.suggest.tl}.
      </p>
      <label className="block font-bold">
        Listing *
        <select name="listing_id" className="field" defaultValue="" required>
          <option value="">Choose…</option>
          {listings.map((l) => (
            <option key={l.listing_id} value={l.listing_id} id={`suggest-${l.listing_id}`}>
              {l.name}
            </option>
          ))}
        </select>
        {fe?.listing_id && <span className="text-sm font-normal text-coral-dk">{fe.listing_id[0]}</span>}
      </label>
      <fieldset>
        <legend className="font-bold">{bi(FOOD_COPY.dish)}</legend>
        <p className="mb-2 text-sm text-muted">Select only dishes you actually serve. Leave blank if unsure.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DISH_TAGS.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="dishTags" value={t} />
              {t}
            </label>
          ))}
        </div>
        {fe?.dishTags && <span className="text-sm font-normal text-coral-dk">{fe.dishTags[0]}</span>}
      </fieldset>
      <label className="block font-bold">
        Menu URL (free)
        <input className="field" name="menuUrl" type="url" placeholder="https://" aria-invalid={!!fe?.menuUrl} />
        {fe?.menuUrl && <span className="text-sm font-normal text-coral-dk">{fe.menuUrl[0]}</span>}
      </label>
      {paid ? (
        <label className="block font-bold">
          Featured dishes (Business Card / Premium)
          <textarea
            className="field"
            name="featuredDishes"
            rows={3}
            placeholder="One dish per line"
            aria-describedby="featured-hint"
          />
          <span id="featured-hint" className="block text-sm font-normal text-muted">
            {FOOD_COPY.paidPerk.en}
          </span>
        </label>
      ) : (
        <p className="rounded-lg bg-sand/60 p-3 text-sm text-muted">{bi(FOOD_COPY.paidPerk)}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block font-bold">
          Your name *
          <input className="field" name="name" required aria-invalid={!!fe?.name} />
          {fe?.name && <span className="text-sm font-normal text-coral-dk">{fe.name[0]}</span>}
        </label>
        <label className="block font-bold">
          Email *
          <input className="field" name="email" type="email" required aria-invalid={!!fe?.email} />
          {fe?.email && <span className="text-sm font-normal text-coral-dk">{fe.email[0]}</span>}
        </label>
        <label className="block font-bold">
          Phone
          <input className="field" name="phone" type="tel" />
        </label>
      </div>
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Suspense>
        <Utm />
      </Suspense>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="consent" className="mt-1" />
        <span>
          I confirm I am authorized to update this listing, and Pinoy Pages may contact me about this suggestion. *
          {fe?.consent && <span className="block text-sm text-coral-dk">{fe.consent[0]}</span>}
        </span>
      </label>
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Sending…" : bi(FOOD_COPY.suggest)}
      </button>
    </form>
  );
}
