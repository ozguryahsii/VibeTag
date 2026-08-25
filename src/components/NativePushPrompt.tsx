"use client";

import { useEffect, useState } from "react";
import { useD } from "@/components/LocaleProvider";
import { Card } from "@/components/ui";
import { IconGlyph } from "@/components/Icon";
import { ICONS } from "@/lib/icons";
import {
  PROMPT_STORAGE_KEY,
  afterDismiss,
  parseMemory,
  shouldAsk,
} from "@/lib/push-prompt";
import { currentPermission, requestAndRegister } from "@/components/native-push";

/**
 * The soft ask.
 *
 * Nobody goes looking in settings for a switch they were never told about, so
 * asking has to happen where the person already is. But the system dialog can
 * only be shown once ever, so it is never opened on sight: this card asks
 * first, and only somebody who taps "turn on" gets the real prompt. "Not now"
 * then costs nothing, which is the entire reason for the extra step.
 *
 * When to show it is `lib/push-prompt.ts`'s decision, not this component's.
 * Rendered on the home screen and again after somebody rates a person — the
 * moment they start expecting something back.
 */
export function NativePushPrompt() {
  const d = useD();
  const [visible, setVisible] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const permission = await currentPermission();
      // localStorage throws outright in some privacy modes; a card that cannot
      // remember a refusal is worse than no card.
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(PROMPT_STORAGE_KEY);
      } catch {
        return;
      }
      if (cancelled) return;
      setVisible(shouldAsk(permission, parseMemory(raw), Date.now()));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function remember() {
    try {
      const raw = window.localStorage.getItem(PROMPT_STORAGE_KEY);
      window.localStorage.setItem(
        PROMPT_STORAGE_KEY,
        JSON.stringify(afterDismiss(parseMemory(raw), Date.now())),
      );
    } catch {
      // Nothing to do — the card simply reappears next time.
    }
  }

  async function enable() {
    setWorking(true);
    const result = await requestAndRegister();
    // Either way the card is done: granted needs no more asking, and a system
    // "don't allow" cannot be undone from here.
    if (result !== "granted") remember();
    setVisible(false);
  }

  function dismiss() {
    remember();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Card className="flex items-start gap-3.5">
      <span
        className="w-10 h-10 shrink-0 grid place-items-center rounded-full"
        style={{ background: "linear-gradient(135deg,#FFB067,#FF8A3D)" }}
      >
        <IconGlyph def={ICONS.bell} size={18} color="#fff" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-extrabold">{d.push.askTitle}</p>
        <p className="text-[12px] text-muted leading-relaxed mt-0.5">
          {d.push.askBody}
        </p>
        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            onClick={enable}
            disabled={working}
            className="h-10 px-4 rounded-full grad-score text-white font-bold text-[13px] disabled:opacity-50"
          >
            {working ? d.common.saving : d.push.askYes}
          </button>
          <button
            type="button"
            onClick={dismiss}
            disabled={working}
            className="h-10 px-4 rounded-full bg-white border border-line font-bold text-[13px] text-muted disabled:opacity-50"
          >
            {d.push.askLater}
          </button>
        </div>
      </div>
    </Card>
  );
}
