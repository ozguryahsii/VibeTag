"use client";

import { useEffect, useState } from "react";
import { useD } from "@/components/LocaleProvider";
import {
  currentPermission,
  pushPlugin,
  requestAndRegister,
  watchTokenState,
} from "@/components/native-push";

/**
 * Notifications inside the app shell.
 *
 * Web Push does not exist in a WKWebView — Apple supports it in Safari and in
 * a home-screen PWA, and nowhere else — so inside the app the browser toggle
 * could only ever say "unsupported". This is the same switch for the native
 * path: APNs on iOS, and the FCM token stored on Android against the day
 * Firebase is wired up.
 *
 * Permission is requested on tap and never on mount. iOS gives an app exactly
 * one chance to ask, and a prompt nobody was expecting is how that chance
 * gets spent on a "no" — see `lib/push-prompt.ts` for the soft ask that
 * exists for the same reason.
 *
 * The listeners themselves live in `native-push.ts`, attached once per page
 * load: this toggle, the soft-ask card and the app-wide bridge all care about
 * the same token, and three copies of the listener would post it three times.
 */

type State = "loading" | "unsupported" | "off" | "on" | "denied" | "working";

export function NativePushToggle() {
  const d = useD();
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!pushPlugin()) {
      setState("unsupported");
      return;
    }
    // The bridge re-registers on launch, so a token that reached the server
    // this session flips the switch without this component asking again.
    const stop = watchTokenState((token) => {
      setState(token === "sent" ? "on" : "off");
    });
    void currentPermission().then((p) => {
      setState((prev) =>
        // Do not overwrite a verdict the token listener has already given.
        prev === "on" || prev === "off"
          ? prev
          : p === "denied"
            ? "denied"
            : p === "granted"
              ? "working"
              : "off",
      );
    });
    return stop;
  }, []);

  async function enable() {
    setState("working");
    const result = await requestAndRegister();
    if (result === "denied") setState("denied");
    else if (result === "prompt") setState("off");
    // "granted" is left on "working": the token listener flips it to "on"
    // once the token has actually reached the server. Saying "on" earlier
    // would claim a delivery path we do not have yet.
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
