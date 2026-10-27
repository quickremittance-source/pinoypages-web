import { NextResponse } from "next/server";
import { approvedEvents, communityEventIcs, eventBySlug } from "@/lib/events";

export function generateStaticParams() {
  return approvedEvents().map((e) => ({ slug: e.slug }));
}

/** Add-to-calendar .ics for an approved community event. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const e = eventBySlug((await params).slug);
  if (!e) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(communityEventIcs(e), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
