import Link from "next/link";

const TABS = [
  { href: "/advertise", label: "Advertise in print" },
  { href: "/get-verified", label: "Get Verified" },
];

/** Joins /advertise and /get-verified as one "Advertise & Get Verified" section. */
export function AdvertiseTabs({ current }: { current: "/advertise" | "/get-verified" }) {
  return (
    <nav aria-label="Advertise & Get Verified" className="mx-auto max-w-5xl px-4 pt-6">
      <ul className="flex flex-wrap gap-2" data-testid="adv-tabs">
        {TABS.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.href === current ? "page" : undefined}
              className={`inline-block rounded-md px-4 py-2 text-sm font-bold ${
                t.href === current ? "bg-[#002050] text-white" : "border border-[#002050] text-[#002050] hover:bg-[#002050]/5"
              }`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
