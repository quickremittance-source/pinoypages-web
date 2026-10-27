"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitCommunityEvent, type FormState } from "@/app/actions";
import { EVENT_CATEGORIES, EVENT_CITIES, EVENTS_COPY, bi, type EventCategory } from "@/lib/events";

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

function Utm() {
  const sp = useSearchParams();
  return <input type="hidden" name="utm_source" value={sp.get("utm_source") ?? ""} />;
}

export function CommunityEventForm() {
  const [s, action, pending] = useActionState(submitCommunityEvent, init);
  const fe = s.status === "error" ? s.fieldErrors : undefined;
  return (
    <form
      id="submit-event"
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6"
      noValidate
      data-testid="community-event-form"
    >
      {s.status !== "idle" && (
        <p
          role={s.status === "error" ? "alert" : "status"}
          className={`rounded-lg p-3 font-bold ${s.status === "error" ? "bg-sand text-coral-dk" : "bg-aqua text-sea"}`}
        >
          {s.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Event title / Pamagat" required err={fe?.title} />
        <Field name="start" label="Start / Simula" type="datetime-local" required err={fe?.start} />
        <Field name="end" label="End / Wakas" type="datetime-local" required err={fe?.end} />
        <label className="block font-bold">
          {bi(EVENTS_COPY.city)} *
          <select name="city" className="field" defaultValue="">
            <option value="">Choose…</option>
            {EVENT_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {fe?.city && <span className="text-sm font-normal text-coral-dk">{fe.city[0]}</span>}
        </label>
        <label className="block font-bold">
          {bi(EVENTS_COPY.category)} *
          <select name="category" className="field" defaultValue="">
            <option value="">Choose…</option>
            {(Object.keys(EVENT_CATEGORIES) as EventCategory[]).map((k) => (
              <option key={k} value={k}>
                {EVENT_CATEGORIES[k].en} · {EVENT_CATEGORIES[k].tl}
              </option>
            ))}
          </select>
          {fe?.category && <span className="text-sm font-normal text-coral-dk">{fe.category[0]}</span>}
        </label>
        <Field name="venue" label="Venue / Lugar" required err={fe?.venue} />
        <Field name="address" label="Address / Tirahan" err={fe?.address} />
        <Field name="organizer" label="Organizer / Tagapag-ayos" required err={fe?.organizer} />
        <Field name="email" label="Email" type="email" required err={fe?.email} />
        <Field name="phone" label="Phone / Telepono" type="tel" err={fe?.phone} />
        <Field name="ticketUrl" label="Tickets URL (optional)" type="url" err={fe?.ticketUrl} />
      </div>
      <label className="block font-bold">
        Description / Paglalarawan
        <textarea name="description" className="field" rows={4} />
      </label>
      {/* Honeypot — same pattern as other forms */}
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Suspense>
        <Utm />
      </Suspense>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="consent" className="mt-1" />
        <span>
          I agree that Pinoy Pages may email me about this event submission. Submissions are reviewed before anything is
          published. *{fe?.consent && <span className="block text-sm text-coral-dk">{fe.consent[0]}</span>}
        </span>
      </label>
      <button className="btn" disabled={pending} type="submit">
        {pending ? "Sending…" : bi(EVENTS_COPY.submit)}
      </button>
    </form>
  );
}
