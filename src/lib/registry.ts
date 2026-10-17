import data from "../../content/guide.json";

/**
 * Tools registry: a tool = one module under src/app/tools/<id> + one entry in content/guide.json `tools`.
 * Disabled entries are planned tools (see PinoyPages_Roadmap.pdf) and are never linked or listed in the sitemap.
 */
export type Tool = (typeof data.tools)[number];
export const liveTools: Tool[] = data.tools.filter((t) => t.enabled);
