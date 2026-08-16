"use client";

import { useActionState } from "react";
import { fraudSweepAction, type SweepState } from "@/lib/actions/moderation";
import { fill, useD } from "@/components/LocaleProvider";

/**
 * Runs the detector again over every rating.
 *
 * The result line matters as much as the button: a sweep that reports
 * "nothing changed" is doing its job, and without saying so it looks broken.
 */
export function FraudSweep() {
  const d = useD();
  const [state, action, pending] = useActionState<SweepState, FormData>(
    fraudSweepAction,
    {},
  );

  return (
    <form action={action} className="flex items-center gap-3">
      <button
        disabled={pending}
        className="text-[12px] font-bold text-muted bg-white border border-line rounded-full px-3.5 py-2 disabled:opacity-50"
      >
        {pending ? d.moderation.sweepRunning : d.moderation.sweep}
      </button>
      {state.scanned !== undefined && (
        <span className="text-[11.5px] text-muted">
          {fill(
            state.changed ? d.moderation.sweepDone : d.moderation.sweepNone,
            { scanned: state.scanned, changed: state.changed ?? 0 },
          )}
        </span>
      )}
    </form>
  );
}
