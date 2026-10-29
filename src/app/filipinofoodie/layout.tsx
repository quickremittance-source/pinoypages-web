import Link from "next/link";
import type { ReactNode } from "react";

const sub = [
  ["", "Home"],
  ["/restaurants", "Restaurants"],
  ["/dish", "Dishes"],
  ["/videos", "Videos"],
  ["/delicacies", "Delicacies"],
  ["/catering", "Catering"],
  ["/groceries", "Groceries"],
  ["/promos", "Promos"],
  ["/claim", "Claim your listing"],
];

export default function FoodieLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <nav aria-label="Filipino Foodie" className="sticky top-[57px] z-20 -mx-4 border-b border-sand bg-white/95 px-4">
        <ul className="flex gap-1 overflow-x-auto py-1 text-sm font-semibold whitespace-nowrap">
          <li className="py-2 pr-2 font-bold text-coral">Filipino Foodie · GTA</li>
          {sub.map(([h, l]) => (
            <li key={h}>
              <Link
                className="inline-block rounded-md px-2.5 py-2 hover:bg-aqua hover:text-sea"
                href={`/filipinofoodie${h}`}
              >
                {l}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
      <p className="mt-10 border-t border-sand py-4 text-xs text-muted">
        Filipino Foodie is a section of Pinoy Pages. Listings come from public sources and may be out of date, so please
        call ahead. Blocks marked AI are AI-generated. Prices are shown only when the owner has confirmed them.{" "}
        <Link href="/filipinofoodie/legal" className="underline">
          Disclaimers
        </Link>
      </p>
    </div>
  );
}
