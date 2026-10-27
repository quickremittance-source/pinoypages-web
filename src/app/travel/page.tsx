import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { JsonLd } from "@/components/JsonLd";
import { Postcard } from "@/components/travel/Postcard";
import { PhotoCredit } from "@/components/travel/PhotoCredit";
import { abs } from "@/lib/guide";
import { credits, HUBS, inHub, toCard, travelPath } from "@/lib/travel";

export const metadata: Metadata = {
  title: "Day Trips from Toronto and Travel Guides from the GTA",
  description:
    "Day trips from Toronto, weekend getaways in Ontario and travel guides from the GTA to the Philippines and beyond, with Filipino-friendly tips.",
  alternates: { canonical: "/travel" },
};

export default function TravelHub() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Pinoy Pages travel guides",
          itemListElement: HUBS.flatMap((h) => inHub(h.id)).map((d, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: abs(travelPath(d)),
            name: d.name,
          })),
        }}
      />
      <PageHead
        kicker="Travel · Paglalakbay"
        title="Day Trips from Toronto and Beyond"
        intro="Postcards from places the GTA's Filipino community loves to visit, from the waterfront to a trip home to the Philippines."
      />
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
        {HUBS.map((h) => (
          <section key={h.id} aria-labelledby={`hub-${h.id}`} data-hub={h.id}>
            <p className="kicker">{h.tl}</p>
            <h2 id={`hub-${h.id}`} className="mt-1 text-2xl font-extrabold text-ink">
              {h.title}
            </h2>
            <p className="mt-1 text-muted">{h.intro}</p>
            <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {inHub(h.id).map((d, i) => (
                <li key={d.slug}>
                  <Postcard card={toCard(d)} index={i} placement={`travel-hub-${h.id}`} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section id="credits" aria-labelledby="credits-h" className="border-t border-sand pt-6">
          <h2 id="credits-h" className="text-sm font-bold text-ink">
            Photo credits
          </h2>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {credits.map((c) => (
              <li key={c.slug}>
                <PhotoCredit c={c} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
