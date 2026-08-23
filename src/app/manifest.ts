import type { MetadataRoute } from "next";

/**
 * The PWA manifest.
 *
 * Served from the app rather than as a static file so the description can
 * one day localise. `display: standalone` matters twice: it is what makes
 * "add to home screen" feel like an app, and store reviewers open the site
 * too — a page that behaves like an app argues the shell is not a wrapper
 * around a mere website.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vibe Tag",
    short_name: "Vibe Tag",
    description:
      "Çevrendeki insanların sende gördüğü iyi şeylerden oluşan dijital sosyal kimliğin.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF8F2",
    theme_color: "#FBF8F2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
