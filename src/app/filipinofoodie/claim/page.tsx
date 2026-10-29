import Link from "next/link";
import { PageTitle } from "@/components/foodie/ui";
import { ffMeta } from "../meta";

export const metadata = ffMeta(
  "Claim Your Filipino Food Business",
  "Claim your free Filipino Foodie listing on Pinoy Pages.",
  "/claim",
);

const tiers = [
  {
    name: "Free listing",
    price: "Free",
    body: "Your business in the GTA guide. Correct your details and confirm your menu prices.",
    href: "/list-free",
    cta: "Claim free listing",
  },
  {
    name: "Kabayan Verified",
    price: "$99/yr + HST",
    body: "Green Verified badge on your listing.",
    href: "/get-verified",
    cta: "Get Verified",
  },
  {
    name: "Kabayan Verified++ with zcard",
    price: "Rates on request",
    body: "Verified plus a zcard digital ad with a tracked QR code and Sponsored placements in your GTA area.",
    href: "/advertise",
    cta: "Ask about zcard",
  },
];

export default function Claim() {
  return (
    <>
      <PageTitle
        title="Claim your listing"
        intro="Own a Filipino restaurant, bakery, catering or grocery business in the GTA? Start free."
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <li key={t.name} className="card flex flex-col p-5">
            <h2 className="text-lg font-bold">{t.name}</h2>
            <p className="my-1 text-2xl font-bold text-sea">{t.price}</p>
            <p className="flex-1 text-sm">{t.body}</p>
            <Link href={t.href} className="btn mt-3 self-start px-3 py-1.5 text-sm">
              {t.cta}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">
        We only send marketing email if you opt in, and you can unsubscribe at any time (CASL).
      </p>
    </>
  );
}
