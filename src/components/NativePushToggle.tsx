"use client";

import { useEffect, useRef, useState } from "react";
import { useD } from "@/components/LocaleProvider";

/**
 * Notifications inside the app shell.
 *
 * Web Push does not exist in a WKWebView — Apple supports it in Safari and in
 * a home-screen PWA, and nowhere else — so inside the iOS app the browser
 * toggle can only ever say "unsupported". This is the same switch for the
 * native path: APNs on iOS, and the FCM token stored on Android against the
 * day Firebase is wired up.
 *
 * The plugin is reached through `window.Capacitor.Plugins`, not through an
 * import. The shell loads this site over `server.url`, so the native bridge
 * injects the plugin proxies at runtime; importing the npm wrapper would put
 * a native-only dependency into the web bundle for the sake of code that can
 * never run there.
 *
 * Permission is requested on tap and never on mount, for the same reason the
 * browser toggle does it that way: iOS gives an app exactly one chance to ask,
 * and a prompt nobody was expecting is how that chance gets spent on a "no".
 */

type PluginResult = { value?: string };
type PermissionResult = { receive?: string };

type PushPlugin = {
  requestPermissions: () => Promise<PermissionResult>;
  checkPermissions: () => Promise<PermissionResult>;
  register: () => Promise<void>;
  addListener: (
    event: string,
    handler: (data: PluginResult) => void,
  ) => Promise<unknown> | unknown;
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

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "working";

export function NativePushToggle() {
  const d = useD();
  const [state, setState] = useState<State>("loading");
  // The token arrives on an event, not as a return value, so the send lives
  // in a listener — and the listener must be attached exactly once.
  const listening = useRef(false);

  useEffect(() => {
    const cap = capacitor();
    const push = cap?.Plugins?.PushNotifications;
    if (!cap || !push) {
      setState("unsupported");
      return;
    }

    const platform = cap.getPlatform?.() === "android" ? "FCM" : "APNS";

    if (!listening.current) {
      listening.current = true;
      void push.addListener("registration", (data) => {
        const token = data?.value;
        if (!token) return;
        void fetch("/api/push/device", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, platform }),
        })
          .then((res) => setState(res.ok ? "on" : "off"))
          .catch(() => setState("off"));
      });
      // Registration can fail for reasons the person cannot act on — no
      // signing entitlement, no network at launch. Say off rather than
      // leaving a spinner that never resolves.
      void push.addListener("registrationError", () => setState("off"));
    }

    push
      .checkPermissions()
      .then((p) => {
        if (p.receive === "denied") return setState("denied");
        // "granted" means iOS will not prompt again, but it does not mean the
        // server has this device — a reinstall issues a new token. Registering
        // is cheap and idempotent, so do it and let the listener confirm.
        if (p.receive === "granted") {
          setState("working");
          return void push.register();
        }
        setState("off");
      })
      .catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    const push = capacitor()?.Plugins?.PushNotifications;
    if (!push) return;
    setState("working");
    try {
      const p = await push.requestPermissions();
      if (p.receive !== "granted") {
        setState(p.receive === "denied" ? "denied" : "off");
        return;
      }
      await push.register();
      // Left on "working" on purpose: the registration listener flips it to
      // "on" once the token has actually reached the server. Saying "on"
      // before that would be claiming a delivery path we do not have yet.
    } catch {
      setState("off");
    }
  }

  if (state === "loading") return null;

  return (
    <div className="card p-5">
      <p className="text-[13.5px] font-extrabold">{d.push.title}</p>
      <p className="text-[12px] text-muted leading-relaxed mt-1">
        {state === "unsupported"
          ? d.push.unsupported
          : state === "denied"
            ? d.push.deniedApp
            : state === "on"
              ? d.push.onApp
              : d.push.body}
      </p>

      {(state === "off" || state === "working") && (
        <button
          type="button"
          disabled={state === "working"}
          onClick={enable}
          className="mt-3.5 h-11 w-full rounded-full grad-score text-white font-bold text-[13.5px] disabled:opacity-50"
        >
          {state === "working" ? d.common.saving : d.push.enable}
        </button>
      )}
    </div>
  );
}
