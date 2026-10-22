import { JsonLd } from "@/components/JsonLd";
import { AltHome } from "@/components/alt/AltHome";
import { brand, SITE_URL } from "@/lib/guide";

/** alt-design branch: alternate home (Airbnb × Yelp feel). The original home lives at /classic. */
export default function Home() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: brand.name, url: SITE_URL }} />
      <AltHome />
    </>
  );
}
