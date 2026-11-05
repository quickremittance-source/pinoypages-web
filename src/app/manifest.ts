import type { MetadataRoute } from "next";
import { colors } from "@/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pinoy Pages",
    short_name: "Pinoy Pages",
    start_url: "/",
    display: "browser",
    background_color: colors.white.hex,
    theme_color: colors.navy.hex,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
