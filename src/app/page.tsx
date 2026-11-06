import { JsonLd } from "@/components/JsonLd";
import { DirectoryIndex } from "@/components/DirectoryIndex";
import { brand, SITE_URL } from "@/lib/guide";

/** Home = Directory index, with a slim Advertise + Magazine strip under the hero. */
export default function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: brand.name, url: SITE_URL }} />
      <DirectoryIndex searchParams={searchParams} promo />
    </>
  );
}
