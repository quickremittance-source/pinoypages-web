/**
 * zcard placement capacity on pinoypages.ca.
 * Spaces are deliberately limited; raise ZCARD_MAX_SLOTS (env) to expand.
 * Unset = no number configured; the public page never shows a count.
 */
export function zcardMaxSlots(): number | null {
  const n = Number(process.env.ZCARD_MAX_SLOTS);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export const ZCARD_SCARCITY_NOTE =
  "Limited spaces available. zcard placements on pinoypages.ca are deliberately limited so every ad gets attention; more spaces may open as demand grows.";
