import { NextResponse } from "next/server";
import { events } from "@/lib/guide";
import { eventIcs } from "@/lib/ics";

export const dynamicParams = false;
export function generateStaticParams() {
  return events.map((e) => ({ file: `${e.id}.ics` }));
}

/** Add-to-calendar file for every event: /ics/<id>.ics */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const e = events.find((x) => `${x.id}.ics` === file);
  if (!e) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(eventIcs(e), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.id}.ics"`,
    },
  });
}
