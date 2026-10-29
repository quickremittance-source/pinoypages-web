import type { Metadata } from "next";
import { SITE_URL } from "@/lib/guide";

export function ffMeta(title: string, description: string, path: string): Metadata {
  return {
    title: `${title} | Filipino Foodie`,
    description,
    alternates: { canonical: `${SITE_URL}/filipinofoodie${path}` },
    other: { "geo.region": "CA-ON" },
  };
}
