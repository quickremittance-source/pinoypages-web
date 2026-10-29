/**
 * zcard "Sponsored" slots for Filipino Foodie. Sizes are design proposals pending Sales confirmation.
 * Placements are only for active Verified++ businesses. No placements exist yet, so every slot serves the
 * "Your business here" house ad. Slot count is configurable (FOODIE_ZCARD_SLOTS, default 3 per page).
 */
export type SlotSize = "banner" | "sidebar";
export const SLOT_HEIGHT: Record<SlotSize, string> = {
  banner: "min-h-[200px] sm:min-h-[110px]",
  sidebar: "min-h-[220px]",
};
export const MAX_SLOTS_PER_PAGE = Number(process.env.FOODIE_ZCARD_SLOTS ?? 3);

export type Placement = {
  zcardId: string;
  name: string;
  tagline: string;
  offer?: string;
  areaSlug: string | null;
};

/** Placement source (zcard_placements in Neon, when created). Serve order: area match, then GTA-wide, then house ad. */
const placements: Placement[] = [];
export function pickPlacement(area: string | null): Placement | null {
  return placements.find((p) => area && p.areaSlug === area) ?? placements.find((p) => p.areaSlug === null) ?? null;
}
