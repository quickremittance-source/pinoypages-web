import type { Metadata } from "next";
import { SITE_URL } from "@/lib/guide";

export function beMeta(title: string, description: string, path: string): Metadata {
  return {
    title: `${title} | Balikbayan Explorer`,
    description,
    alternates: { canonical: `${SITE_URL}/explore${path}` },
    other: { "geo.region": "CA-ON" },
  };
}
