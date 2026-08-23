import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Vibe Tag shell.
 *
 * The app is the live site: `server.url` points the WebView at production,
 * so a deploy to vibetag.net is a deploy to the apps too — no store review
 * cycle for content changes. What the shell itself owns is the icon, the
 * splash, the status bar, and the user-agent token the server reads to
 * behave store-appropriately (see src/lib/shell-ua.ts — the token below
 * must match it exactly).
 *
 * `appId` is forever on Google Play — it cannot change after first upload.
 * It matches the product-id family in src/lib/store-products.ts
 * (net.vibetag.*), and the iOS bundle id should be registered as the same
 * string.
 */
const config: CapacitorConfig = {
  appId: "net.vibetag.app",
  appName: "Vibe Tag",
  webDir: "www",
  server: {
    url: "https://vibetag.net",
    allowNavigation: ["vibetag.net", "www.vibetag.net"],
  },
  appendUserAgent: "VibeTagShell/1.0",
  backgroundColor: "#FBF8F2",
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: "#FBF8F2",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#FBF8F2",
    },
  },
};

export default config;
