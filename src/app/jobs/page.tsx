import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { JobSubmitForm } from "@/components/jobs/JobSubmitForm";
import { JOB_COPY, approvedJobs, bi } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "Jobs · Mga Trabaho",
  description: JOB_COPY.intro.en,
  alternates: { canonical: "/jobs" },
};

export default function JobsPage() {
  const jobs = approvedJobs();

  return (
    <>
      <PageHead kicker={bi(JOB_COPY.kicker)} title={JOB_COPY.title.en} intro={JOB_COPY.intro.en}>
        <p className="mt-2 text-muted">{JOB_COPY.title.tl}</p>
        <p className="mt-1 text-sm text-muted">{JOB_COPY.intro.tl}</p>
        <a href="#submit-job" className="btn mt-4 inline-block">
          {bi(JOB_COPY.submit)}
        </a>
      </PageHead>
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        {jobs.length === 0 ? (
          <div className="rounded-2xl bg-sand/50 p-8 text-center" data-testid="jobs-empty">
            <p className="text-lg font-bold text-ink">{JOB_COPY.empty.en}</p>
            <p className="mt-1 text-muted">{JOB_COPY.empty.tl}</p>
          </div>
        ) : (
          <ul className="space-y-4" data-testid="jobs-list">
            {jobs.map((j) => (
              <li key={j.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-ink">{j.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {j.businessName} · {j.city}
                </p>
                <p className="mt-3 text-sm whitespace-pre-wrap">{j.description}</p>
              </li>
            ))}
          </ul>
        )}

        <section aria-labelledby="submit-job-heading" className="space-y-4">
          <h2 id="submit-job-heading" className="text-2xl font-bold text-ink">
            {bi(JOB_COPY.submit)}
          </h2>
          <p className="text-muted">
            For listed businesses only. We review every submission before anything appears — nothing is auto-published.
          </p>
          <JobSubmitForm />
        </section>
      </div>
    </>
  );
}
