import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { brand } from "@/lib/guide";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Page() {
  return (
    <>
      <PageHead kicker="Privacy" title="Privacy policy" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <p>
          We collect only what you type into our forms (name, business, email, phone, message) to reply about listings
          and advertising.
        </p>
        <p>The free tools run in your browser; the numbers you enter are not sent to us.</p>
        <p>
          We do not sell your information. We email you only with your consent, and you can unsubscribe at any time
          (Canada&apos;s anti-spam law, CASL).
        </p>
        <p>
          To see, correct or delete your information, email {brand.email}. This policy follows Canada&apos;s PIPEDA
          principles. Draft — to be reviewed by a lawyer before launch.
        </p>
      </div>
    </>
  );
}
