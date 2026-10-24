import type { MetadataRoute } from "next";
import { club } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: club.name,
    short_name: club.shortName,
    description: club.heroLine,
    start_url: "/",
    display: "standalone",
    background_color: "#0e0d0f",
    theme_color: "#0e0d0f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
