import Link from "next/link";
import { fetchCadPhp } from "@/lib/fx";
import { PesoTool } from "@/app/tools/peso-converter/PesoTool";
import { RemittanceTool } from "@/app/tools/remittance-compare/RemittanceTool";
import { BalikbayanTool } from "@/app/tools/balikbayan-box/BalikbayanTool";

type ToolId = "peso-converter" | "remittance-compare" | "balikbayan-box";

/** Which free tools appear on which directory category page. */
export const CATEGORY_TOOLS: Record<string, ToolId[]> = {
  "money-business": ["peso-converter", "remittance-compare"],
  "insurance-financial": ["peso-converter", "remittance-compare"],
  "travel-padala-remit": ["peso-converter", "remittance-compare", "balikbayan-box"],
};

const TITLES: Record<ToolId, string> = {
  "peso-converter": "Peso converter (CAD / PHP)",
  "remittance-compare": "Compare remittance providers (CAD to PHP)",
  "balikbayan-box": "Balikbayan box carriers",
};

export async function CategoryTools({ slug }: { slug: string }) {
  const tools = CATEGORY_TOOLS[slug];
  if (!tools?.length) return null;
  const needsQuote = tools.some((t) => t !== "balikbayan-box");
  const q = needsQuote ? await fetchCadPhp() : null;
  const quote = q
    ? { rate: q.rate, asOf: q.asOf, sourceName: q.sourceName, sourceUrl: q.sourceUrl, fetchedAt: q.fetchedAt }
    : null;
  return (
    <section aria-labelledby={`tools-${slug}`} className="space-y-8" data-testid="category-tools">
      <h2 id={`tools-${slug}`} className="text-2xl font-bold text-ink">
        Free tools
      </h2>
      {tools.map((t) => (
        <div key={t} className="rounded-3xl bg-sand/30 p-5" data-tool={t}>
          <h3 className="mb-4 flex flex-wrap items-baseline justify-between gap-2 text-xl font-bold text-ink">
            {TITLES[t]}
            <Link href={`/tools/${t}`} className="text-sm font-semibold text-turqdk underline">
              Open full page
            </Link>
          </h3>
          {t === "peso-converter" && <PesoTool quote={quote} />}
          {t === "remittance-compare" && <RemittanceTool quote={quote} />}
          {t === "balikbayan-box" && <BalikbayanTool />}
        </div>
      ))}
    </section>
  );
}
