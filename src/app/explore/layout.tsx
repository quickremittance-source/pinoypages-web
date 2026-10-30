import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BE, TOPICS } from "@/lib/explorer/data";

export default function ExplorerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <nav
        aria-label="Balikbayan Explorer"
        className="sticky top-[57px] z-20 -mx-4 border-b border-sand bg-white/95 px-4"
      >
        <ul className="flex items-center gap-1 overflow-x-auto py-1 text-sm font-semibold whitespace-nowrap">
          <li className="pr-2">
            <Link href={BE} className="flex items-center gap-2 py-1 font-bold text-sea">
              <Image
                src="/brand/balikbayan-explorer.jpg"
                alt=""
                width={40}
                height={30}
                className="h-8 w-auto rounded"
              />
              Balikbayan Explorer · GTA
            </Link>
          </li>
          {TOPICS.map((t) => (
            <li key={t.slug}>
              <Link
                className="inline-block rounded-md px-2.5 py-2 hover:bg-aqua hover:text-sea"
                href={`${BE}/${t.slug}`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
      <p className="mt-10 border-t border-sand py-4 text-xs text-muted">
        Balikbayan Explorer is a section of Pinoy Pages. Videos are embedded from YouTube and belong to their creators;
        Pinoy Pages does not endorse any provider shown. Curator notes marked AI are AI-written. Everything in this
        section is a draft under review. Rules, fees and exchange rates change, so confirm with the provider or the
        Bureau of Customs before you send or travel.
      </p>
    </div>
  );
}
