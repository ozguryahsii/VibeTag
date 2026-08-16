"use client";

import { useEffect, useState } from "react";
import { useD } from "@/components/LocaleProvider";

/** base64url → bytes, the format `applicationServerKey` insists on. */
function decodeKey(base64: string): ArrayBuffer {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "working";

/**
 * Turns browser notifications on and off.
 *
 * Rendered only when VAPID keys exist, so nobody is offered a switch that
 * cannot do anything. The permission prompt is never raised on load — only
 * when the person taps, because an unexplained prompt is how people end up
 * blocking notifications permanently.
 */
export function PushToggle({ publicKey }: { publicKey: string }) {
  const d = useD();
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(publicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
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
            ? d.push.denied
            : d.push.body}
      </p>

      {(state === "off" || state === "on" || state === "working") && (
        <button
          type="button"
          disabled={state === "working"}
          onClick={state === "on" ? disable : enable}
          className={
            state === "on"
              ? "mt-3.5 h-11 w-full rounded-full bg-white border border-line font-bold text-[13.5px] text-muted disabled:opacity-50"
              : "mt-3.5 h-11 w-full rounded-full grad-score text-white font-bold text-[13.5px] disabled:opacity-50"
          }
        >
          {state === "working"
            ? d.common.saving
            : state === "on"
              ? d.push.disable
              : d.push.enable}
        </button>
      )}
    </div>
  );
}
