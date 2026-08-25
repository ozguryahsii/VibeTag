"use client";

import type { PushPermission } from "@/lib/push-prompt";

/**
 * The bridge to the native push plugin, in one place.
 *
 * Reached through `window.Capacitor.Plugins` rather than an import: the shell
 * loads this site over `server.url`, so the native runtime injects the plugin
 * proxies, and importing the npm wrapper would put a native-only dependency
 * into the web bundle for code that can never run there.
 *
 * Listeners are attached exactly once per page load. There are three places
 * that care about push — the settings toggle, the soft-ask card and the
 * app-wide bridge that handles taps — and each attaching its own `registration`
 * listener would mean the same token posted three times per launch.
 */

type PluginResult = { value?: string };
type PermissionResult = { receive?: string };
type ActionResult = { notification?: { data?: Record<string, unknown> } };

type PushPlugin = {
  requestPermissions: () => Promise<PermissionResult>;
  checkPermissions: () => Promise<PermissionResult>;
  register: () => Promise<void>;
  addListener: (event: string, handler: (data: never) => void) => unknown;
};

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: { PushNotifications?: PushPlugin };
};

function capacitor(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  const c = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  return c?.isNativePlatform?.() ? c : null;
}

/** The push plugin, or null anywhere that is not the app shell. */
export function pushPlugin(): PushPlugin | null {
  return capacitor()?.Plugins?.PushNotifications ?? null;
}

export function devicePlatform(): "APNS" | "FCM" {
  return capacitor()?.getPlatform?.() === "android" ? "FCM" : "APNS";
}

/** Whether the token has reached our server this session. */
export type TokenState = "unknown" | "sent" | "failed";

const watchers = new Set<(state: TokenState) => void>();
let lastState: TokenState = "unknown";

export function watchTokenState(fn: (state: TokenState) => void): () => void {
  watchers.add(fn);
  if (lastState !== "unknown") fn(lastState);
  return () => {
    watchers.delete(fn);
  };
}

function announce(state: TokenState) {
  lastState = state;
  for (const fn of watchers) fn(state);
}

/**
 * Where a tapped notification should take the reader.
 *
 * Kept as a mutable module value rather than a closure, because the listener
 * is attached once for the life of the page while the router that performs
 * the navigation belongs to a component that may remount.
 */
let navigate: ((url: string) => void) | null = null;

export function setPushNavigator(fn: (url: string) => void): void {
  navigate = fn;
}

let attached = false;

/** Attach the plugin listeners. Safe to call from anywhere, any number of times. */
export function attachPushListeners(): void {
  const push = pushPlugin();
  if (!push || attached) return;
  attached = true;

  push.addListener("registration", (data: PluginResult) => {
    const token = data?.value;
    if (!token) return;
    void fetch("/api/push/device", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, platform: devicePlatform() }),
    })
      .then((res) => announce(res.ok ? "sent" : "failed"))
      .catch(() => announce("failed"));
  });

  // Registration can fail for reasons the reader cannot act on — a missing
  // entitlement, no network at launch. Say so rather than leaving a spinner
  // that never resolves.
  push.addListener("registrationError", () => announce("failed"));

  /*
   * The whole point of carrying `url` in the payload: a tapped notification
   * about a message must open that conversation, not the home screen. Without
   * this listener the app simply opens wherever it was, which reads as the
   * notification having done nothing.
   */
  push.addListener("pushNotificationActionPerformed", (event: ActionResult) => {
    const url = event?.notification?.data?.url;
    // Only same-origin paths are followed. The payload is ours today, but a
    // navigation target taken from a message body is not a thing to be
    // relaxed about later.
    const target = typeof url === "string" && url.startsWith("/") ? url : "/notifications";
    navigate?.(target);
  });
}

export async function currentPermission(): Promise<PushPermission> {
  const push = pushPlugin();
  if (!push) return "denied";
  try {
    const p = await push.checkPermissions();
    if (p.receive === "granted") return "granted";
    if (p.receive === "denied") return "denied";
    return "prompt";
  } catch {
    return "denied";
  }
}

/**
 * Ask iOS for permission and register, in that order.
 *
 * Only ever called from a tap on our own card — never on mount. iOS gives an
 * app one chance to show this dialog, and an unexplained prompt is how that
 * chance gets spent on a "no".
 */
export async function requestAndRegister(): Promise<PushPermission> {
  const push = pushPlugin();
  if (!push) return "denied";
  attachPushListeners();
  try {
    const p = await push.requestPermissions();
    if (p.receive !== "granted") {
      return p.receive === "denied" ? "denied" : "prompt";
    }
    await push.register();
    return "granted";
  } catch {
    return "prompt";
  }
}

/**
 * Re-register an install that already has permission.
 *
 * Cheap, idempotent, and necessary: APNs issues a new token after a reinstall
 * or a restore, and an install that only registered once would go quietly
 * unreachable with the switch still showing "on".
 */
export async function refreshRegistration(): Promise<void> {
  const push = pushPlugin();
  if (!push) return;
  if ((await currentPermission()) !== "granted") return;
  attachPushListeners();
  try {
    await push.register();
  } catch {
    // Nothing the reader can do about it, and nothing worth interrupting for.
  }
}
