"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { submitClaim, submitEvent, submitInquiry, submitSignup, type FormState } from "@/app/actions";

const init: FormState = { status: "idle" };

function Field({
  name,
  label,
  err,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  err?: string[];
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block font-bold">
      {label}
      {required && " *"}
      <input
        className="field"
        name={name}
        type={type}
        aria-invalid={!!err}
        aria-describedby={err ? `${name}-err` : undefined}
      />
      {err && (
        <span id={`${name}-err`} className="text-sm font-normal text-coral-dk">
          {err[0]}
        </span>
      )}
    </label>
  );
}

function Common({ fe }: { fe?: Record<string, string[] | undefined> }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Your name" required err={fe?.name} />
        <Field name="business" label="Business name" required err={fe?.business} />
        <Field name="email" label="Email" type="email" required err={fe?.email} />
        <Field name="phone" label="Phone" type="tel" err={fe?.phone} />
      </div>
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Suspense>
        <Utm />
      </Suspense>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="consent" className="mt-1" />
        <span>
          I agree that Pinoy Pages may contact me about my listing and advertising. *
          {fe?.consent && <span className="block text-sm text-coral-dk">{fe.consent[0]}</span>}
        </span>
      </label>
    </>
  );
}

/** Passes utm_source through as the contact source tag. */
function Utm() {
  const sp = useSearchParams();
  return <input type="hidden" name="utm_source" value={sp.get("utm_source") ?? ""} />;
}

function Status({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return (
    <p
      role={s.status === "error" ? "alert" : "status"}
      className={`rounded-lg p-3 font-bold ${s.status === "error" ? "bg-sand text-coral-dk" : "bg-aqua text-sea"}`}
    >
      {s.message}
    </p>
  );
}

export function InquiryForm({ slot }: { slot?: string }) {
  const [s, action, pending] = useActionState(submitInquiry, init);
  const fe = s.status === "error" ? s.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4 rounded-2xl bg-white p-6" noValidate>
      <Status s={s} />
      <Common fe={fe} />
      <label className="block font-bold">
        I&apos;m interested in *
        <select name="product" className="field" defaultValue="">
          <option value="">Choose…</option>
          <option value="verified">Verified ($199, everything included)</option>
          <option value="ad-2027">An ad in the April 2027 edition (register interest)</option>
        </select>
        {fe?.product && <span className="text-sm font-normal text-coral-dk">{fe.product[0]}</span>}
      </label>
      <input type="hidden" name="slot" value={slot ?? ""} />
      <label className="block font-bold">
        Message
        <textarea name="message" className="field" rows={3} />
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}

export function ClaimForm({ listing, listingName }: { listing?: string; listingName?: string }) {
  const [s, action, pending] = useActionState(submitClaim, init);
  const fe = s.status === "error" ? s.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4 rounded-2xl bg-white p-6" noValidate>
      <Status s={s} />
      {listingName && (
        <p className="rounded-lg bg-aqua p-3">
          Claiming: <strong>{listingName}</strong>
        </p>
      )}
      <input type="hidden" name="listing" value={listing ?? ""} />
      <Common fe={fe} />
      <fieldset>
        <legend className="font-bold">Choose a plan *</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            ["free", "Keep free"],
            ["verified", "Verified"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 rounded-lg border border-sea/30 p-2">
              <input type="radio" name="plan" value={v} defaultChecked={v === "free"} /> {l}
            </label>
          ))}
        </div>
        {fe?.plan && <span className="text-sm text-coral-dk">{fe.plan[0]}</span>}
      </fieldset>
      <label className="block font-bold">
        Corrections to your listing
        <textarea name="corrections" className="field" rows={3} />
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "Sending…" : "Claim my listing"}
      </button>
    </form>
  );
}

export function EventForm({ members }: { members: { id: string; name: string }[] }) {
  const [s, action, pending] = useActionState(submitEvent, init);
  const fe = s.status === "error" ? s.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4 rounded-2xl bg-white p-6" noValidate>
      <Status s={s} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="eventName" label="Event name" required err={fe?.eventName} />
        <Field name="date" label="Date" type="date" required err={fe?.date} />
        <Field name="time" label="Time" err={fe?.time} />
        <Field name="place" label="Place" required err={fe?.place} />
        <Field name="organizer" label="Organizer" required err={fe?.organizer} />
        <Field name="email" label="Organizer email" type="email" required err={fe?.email} />
        <Field name="phone" label="Organizer phone" type="tel" err={fe?.phone} />
      </div>
      <fieldset>
        <legend className="font-bold">Listing type *</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-sea/30 p-2">
            <input type="radio" name="plan" value="event-free" defaultChecked /> Free event listing
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-sea/30 p-2">
            <input type="radio" name="plan" value="event-featured" /> Featured event ($49, free for members)
          </label>
        </div>
        {fe?.plan && <span className="text-sm text-coral-dk">{fe.plan[0]}</span>}
      </fieldset>
      <label className="block font-bold">
        Member? Choose your paid listing
        <select name="memberListing" className="field" defaultValue="">
          <option value="">Not a member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <Field name="link" label="Registration link (featured only)" type="url" err={fe?.link} />
      <label className="block font-bold">
        Description (featured only)
        <textarea name="description" className="field" rows={3} />
      </label>
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Suspense>
        <Utm />
      </Suspense>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="consent" className="mt-1" />
        <span>
          I agree that Pinoy Pages may contact me about this event. *
          {fe?.consent && <span className="block text-sm text-coral-dk">{fe.consent[0]}</span>}
        </span>
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "Sending…" : "Submit event"}
      </button>
    </form>
  );
}

export function SignupForm() {
  const [s, action, pending] = useActionState(submitSignup, init);
  const fe = s.status === "error" ? s.fieldErrors : undefined;
  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6"
      noValidate
      aria-label="Monthly member email sign-up"
    >
      <Status s={s} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="First name" err={fe?.name} />
        <Field name="email" label="Email" type="email" required err={fe?.email} />
      </div>
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Suspense>
        <Utm />
      </Suspense>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="consent" className="mt-1" />
        <span>
          Yes, email me the monthly Pinoy Pages member email. I can unsubscribe at any time. *
          {fe?.consent && <span className="block text-sm text-coral-dk">{fe.consent[0]}</span>}
        </span>
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "Sending…" : "Sign me up"}
      </button>
    </form>
  );
}
