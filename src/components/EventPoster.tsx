import type { CalEvent } from "@/lib/guide";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/guide";

const COLORS: Record<EventCategory, [string, string]> = {
  tax: ["#C8102E", "#9E0C24"],
  money: ["#0E7C86", "#0A5F67"],
  business: ["#0A5F67", "#14606B"],
  insurance: ["#B5452F", "#9E0C24"],
  community: ["#0E7C86", "#C8102E"],
  awards: ["#C8102E", "#0E7C86"],
};

/** Featured-event image: generated poster (category colour, date, pinstripes). Real events upload a photo. */
export function EventPoster({ e, className = "" }: { e: CalEvent; className?: string }) {
  const cat = (e.category ?? "community") as EventCategory;
  const [a, b] = COLORS[cat];
  const d = new Date(`${e.date}T12:00:00Z`);
  const mon = d.toLocaleDateString("en-CA", { month: "short", timeZone: "UTC" }).toUpperCase();
  const day = d.getUTCDate();
  return (
    <svg
      viewBox="0 0 320 180"
      className={className}
      role="img"
      aria-label={`Event image: ${EVENT_CATEGORIES[cat]} event, ${mon} ${day}`}
    >
      <defs>
        <linearGradient id={`g-${e.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <pattern id={`p-${e.id}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="1" height="12" fill="#fff" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="320" height="180" fill={`url(#g-${e.id})`} />
      <rect width="320" height="180" fill={`url(#p-${e.id})`} />
      <rect x="20" y="20" width="70" height="78" rx="10" fill="#fff" />
      <text x="55" y="45" textAnchor="middle" fontSize="15" fontWeight="700" fill={a} fontFamily="Inter, sans-serif">
        {mon}
      </text>
      <text
        x="55"
        y="84"
        textAnchor="middle"
        fontSize="36"
        fontWeight="800"
        fill="#1B2328"
        fontFamily="Inter, sans-serif"
      >
        {day}
      </text>
      <text x="20" y="140" fontSize="14" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif" letterSpacing="2">
        {EVENT_CATEGORIES[cat].toUpperCase()}
      </text>
      <text x="20" y="160" fontSize="12" fill="#fff" opacity="0.9" fontFamily="Inter, sans-serif">
        {e.city} · Pinoy Pages Calendar{e.sample ? " · SAMPLE" : ""}
      </text>
      <rect x="0" y="172" width="320" height="2" fill="#fff" opacity="0.8" />
      <rect x="0" y="176" width="320" height="4" fill="#fff" opacity="0.35" />
    </svg>
  );
}
