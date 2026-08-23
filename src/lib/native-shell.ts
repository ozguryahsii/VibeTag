import "server-only";

import { headers } from "next/headers";
import { isShellUserAgent } from "@/lib/shell-ua";

export { isShellUserAgent, SHELL_UA_TOKEN } from "@/lib/shell-ua";

/**
 * Is this request coming from inside the Vibe Tag mobile shell?
 *
 * The Capacitor config appends a token to the WebView's user agent, and the
 * pages that must behave differently in the stores' apps — chiefly the
 * membership screen, which may not show prices next to no purchase button
 * (App Store guideline 3.1.1) — read it here. Server-side on purpose: these
 * pages are server components, and a client-side check would flash the web
 * version first.
 */
export async function isNativeShell(): Promise<boolean> {
  const h = await headers();
  return isShellUserAgent(h.get("user-agent"));
}
