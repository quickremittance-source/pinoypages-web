"use client";

import { useActionState, useEffect } from "react";
import { track } from "@/lib/gtag";
import { submitJob, type FormState } from "@/app/actions";
import { JOB_CITIES, JOB_COPY, bi, listingOptions } from "@/lib/jobs";

const init: FormState = { status: "idle" };

export function JobSubmitForm() {
  const [s, action, pending] = useActionState(submitJob, init);
  const listings = listingOptions();

  useEffect(() => {
    if (s.status === "success") track("job_submit_success", {});
  }, [s.status]);

  return (
    <form
      id="submit-job"
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
      data-testid="job-submit-form"
      onSubmit={() => track("job_submit_attempt", {})}
    >
      {/* honeypot */}
      <input type="text" name="website_url" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <label className="block font-bold">
        {bi(JOB_COPY.listing)} *
        <select className="field mt-1" name="listingId" required defaultValue="">
          <option value="" disabled>
            Select a listing
          </option>
          {listings.map((l) => (
            <option key={l.listing_id} value={l.listing_id}>
              {l.name} ({l.area})
            </option>
          ))}
        </select>
      </label>

      <label className="block font-bold">
        {bi(JOB_COPY.jobTitle)} *
        <input className="field mt-1" name="title" required maxLength={160} />
      </label>

      <label className="block font-bold">
        {bi(JOB_COPY.city)} *
        <select className="field mt-1" name="city" required defaultValue="">
          <option value="" disabled>
            Select a city
          </option>
          {JOB_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block font-bold">
        {bi(JOB_COPY.description)} *
        <textarea className="field mt-1" name="description" required rows={5} maxLength={4000} />
      </label>

      <label className="block font-bold">
        {bi(JOB_COPY.applyUrl)}
        <input className="field mt-1" name="applyUrl" type="url" placeholder="https://" maxLength={300} />
      </label>

      <label className="block font-bold">
        {bi(JOB_COPY.applyEmail)}
        <input className="field mt-1" name="applyEmail" type="email" maxLength={200} />
      </label>

      <label className="block font-bold">
        {bi(JOB_COPY.contactName)} *
        <input className="field mt-1" name="contactName" required maxLength={120} />
      </label>

      <label className="block font-bold">
        {bi(JOB_COPY.contactEmail)} *
        <input className="field mt-1" name="contactEmail" type="email" required maxLength={200} />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" value="on" required className="mt-1" />
        <span>{bi(JOB_COPY.consent)}</span>
      </label>

      {s.status === "error" ? (
        <p role="alert" className="rounded-lg bg-sand p-3 text-sm font-semibold text-coral-dk">
          {s.message}
        </p>
      ) : null}
      {s.status === "success" ? (
        <p role="status" className="rounded-lg bg-aqua p-3 text-sm font-semibold" data-testid="job-submit-success">
          {s.message}
        </p>
      ) : null}

      <button className="btn" disabled={pending} type="submit">
        {pending ? "Sending…" : bi(JOB_COPY.submit)}
      </button>
    </form>
  );
}
