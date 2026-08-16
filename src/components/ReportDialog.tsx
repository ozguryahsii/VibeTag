"use client";

import { useActionState, useState } from "react";
import { reportAction, type SafetyState } from "@/lib/actions/safety";
import { REPORT_REASONS } from "@/lib/moderation";
import { useD } from "@/components/LocaleProvider";

/**
 * Reporting a rating never tells the reporter who wrote it, and never tells
 * the author they were reported — both would turn a safety tool into a way
 * of unmasking or retaliating.
 */
export function ReportDialog({
  ratingId,
  username,
  label,
  compact = false,
}: {
  ratingId?: string;
  username?: string;
  label?: string;
  compact?: boolean;
}) {
  const d = useD();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SafetyState, FormData>(
    reportAction,
    {},
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "text-[11.5px] font-bold text-muted underline underline-offset-2"
            : "h-11 w-full rounded-full bg-white border border-line text-[13.5px] font-bold text-muted active:scale-[0.98] transition-transform"
        }
      >
        {label ?? d.report.submit}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center"
          style={{ background: "rgba(31,31,31,0.35)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[480px] mx-auto rounded-t-[30px] sm:rounded-[30px] bg-warmwhite p-6 pb-8 border border-line shadow-[0_24px_70px_rgba(76,44,31,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-line mx-auto mb-5 sm:hidden" />

            {state.ok ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto rounded-full grid place-items-center grad-score text-white text-xl font-black">✓</div>
                <p className="vt-page-title text-[22px] mt-4">
                  {d.report.received}
                </p>
                <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
                  {state.ok}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-5 h-12 w-full rounded-full grad-score text-white font-bold text-[14.5px]"
                >
                  {d.common.close}
                </button>
              </div>
            ) : (
              <form action={action}>
                {ratingId && (
                  <input type="hidden" name="ratingId" value={ratingId} />
                )}
                {username && (
                  <input type="hidden" name="username" value={username} />
                )}

                <p className="text-[10px] font-extrabold tracking-[0.22em] text-coral mb-2">
                  {d.report.kicker}
                </p>
                <h2 className="vt-page-title text-[24px] tracking-[-0.02em]">
                  {d.report.title}
                </h2>
                <p className="text-[12.5px] text-muted mt-1.5 leading-relaxed">
                  {ratingId ? d.report.bodyRating : d.report.bodyUser}
                </p>

                <div className="mt-4 grid gap-2">
                  {REPORT_REASONS.map((key, i) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 rounded-[18px] border border-line bg-cream px-4 py-3 cursor-pointer has-[:checked]:border-coral/40 has-[:checked]:bg-tagbg"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={key}
                        defaultChecked={i === 0}
                        className="w-4 h-4 accent-[#FF5C77]"
                      />
                      <span className="text-[13.5px] font-semibold">
                        {d.report.reasons[key]}
                      </span>
                    </label>
                  ))}
                </div>

                <textarea
                  name="note"
                  rows={3}
                  maxLength={500}
                  placeholder={d.report.notePlaceholder}
                  className="mt-3 w-full rounded-[18px] border border-line bg-cream p-4 text-[14px] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 resize-none"
                />

                {state.error && (
                  <p className="mt-3 text-[12.5px] font-semibold text-coral">
                    {state.error}
                  </p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-12 px-6 rounded-full bg-white border border-line font-bold text-[14px]"
                  >
                    {d.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 h-12 rounded-full grad-score text-white font-bold text-[14.5px] disabled:opacity-50"
                  >
                    {pending ? d.common.sending : d.report.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
