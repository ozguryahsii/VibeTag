"use client";

import { useEffect, useState } from "react";
import { needsOpenConsent } from "@/lib/rating-rules";
import { useD } from "@/components/LocaleProvider";

/**
 * The three doors, and the one that asks first.
 *
 * "My circle" and "Nobody" only ever take something away, so they save on a
 * tap. "Everyone" hands strangers the right to write about a real person,
 * and after App Review upheld guideline 1.2 a second time it is the one
 * choice that has to be said out loud: a sheet that spells out what changes
 * and a box to tick before the form will submit. The server action checks
 * the same box — this dialog is the explanation, not the lock.
 */
export function RatingPolicyPicker({
  value,
  action,
}: {
  value: string;
  /** setRatingPolicyAction, passed down so this stays a dumb client shell. */
  action: (formData: FormData) => void | Promise<void>;
}) {
  const d = useD();
  const [asking, setAsking] = useState(false);
  const [agreed, setAgreed] = useState(false);

  /*
   * The sheet closes when the server says it happened, not when the button
   * is pressed. Closing it on the click unmounted the form mid-submit and
   * the action never ran — the dialog vanished, the setting did not move,
   * and nothing on screen said so.
   */
  useEffect(() => {
    if (needsOpenConsent(value)) setAsking(false);
  }, [value]);

  const options = [
    { key: "EVERYONE", label: d.settings.everyone, hint: d.settings.everyoneHint },
    { key: "CIRCLE", label: d.settings.circleOnly, hint: d.settings.circleOnlyHint },
    { key: "NOBODY", label: d.settings.nobody, hint: d.settings.nobodyHint },
  ];

  return (
    <>
      {/* One column: three doors with a line of explanation each read better
          stacked than squeezed side by side on a phone. */}
      <div className="grid gap-2.5" data-testid="rating-policy">
        {options.map((opt) => {
          const active = value === opt.key;
          const gated = needsOpenConsent(opt.key);

          const face = (
            <>
              <span className="block text-[13px] font-bold">{opt.label}</span>
              <span className="block text-[11px] text-muted mt-0.5">
                {opt.hint}
              </span>
            </>
          );
          const className = `w-full rounded-[20px] p-3 text-left ${
            active ? "grad-ring" : "bg-cream border border-line"
          }`;

          if (gated) {
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={active}
                aria-haspopup="dialog"
                onClick={() => {
                  setAgreed(false);
                  setAsking(true);
                }}
                className={className}
              >
                {face}
              </button>
            );
          }

          return (
            <form key={opt.key} action={action}>
              <input type="hidden" name="ratingPolicy" value={opt.key} />
              <button type="submit" aria-pressed={active} className={className}>
                {face}
              </button>
            </form>
          );
        })}
      </div>

      {asking && (
        <div
          className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label={d.settings.openConsentTitle}
          onClick={() => setAsking(false)}
        >
          <div
            className="w-full max-w-[340px] rounded-[26px] bg-warmwhite p-6"
            style={{ boxShadow: "0 24px 64px rgba(40,24,12,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[16px] font-extrabold leading-tight">
              {d.settings.openConsentTitle}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink/85">
              {d.settings.openConsentBody}
            </p>

            <label className="mt-4 flex items-start gap-2.5 rounded-[18px] bg-cream p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                data-testid="open-consent"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF5C77]"
              />
              <span className="text-[12px] leading-relaxed font-semibold">
                {d.settings.openConsentCheck}
              </span>
            </label>

            <form action={action} className="mt-4 grid gap-2.5">
              <input type="hidden" name="ratingPolicy" value="EVERYONE" />
              <input type="hidden" name="consent" value="1" />
              <button
                type="submit"
                disabled={!agreed}
                className="h-11 w-full rounded-full grad-score text-white font-bold text-[13.5px] disabled:opacity-40"
              >
                {d.settings.openConsentConfirm}
              </button>
              <button
                type="button"
                onClick={() => setAsking(false)}
                className="h-11 w-full rounded-full bg-white border border-line font-bold text-[13px] text-muted"
              >
                {d.common.cancel}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
