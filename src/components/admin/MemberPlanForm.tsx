"use client";

import { useActionState } from "react";
import { setMemberPlanAction, type AdminState } from "@/lib/actions/admin";
import { useD } from "@/components/LocaleProvider";

/**
 * Grant a plan to one person.
 *
 * One of these per member row rather than a single form with a target field:
 * on a phone the thing you tap has to be next to the person you are looking
 * at, and picking the wrong row out of a dropdown is exactly the mistake this
 * screen must not make easy.
 */
export function MemberPlanForm({
  username,
  plan,
}: {
  username: string;
  plan: string;
}) {
  const d = useD();
  const [state, action, pending] = useActionState<AdminState, FormData>(
    setMemberPlanAction,
    {},
  );
  const a = d.admin.members;

  return (
    <form action={action} className="mt-3 border-t border-line pt-3">
      <input type="hidden" name="username" value={username} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="block text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-muted mb-1">
            {a.setPlan}
          </span>
          <select
            name="plan"
            defaultValue={plan}
            className="w-full h-10 rounded-full bg-white border border-line px-3.5 text-[13px] font-bold"
          >
            {(["FREE", "SILVER", "GOLD"] as const).map((p) => (
              <option key={p} value={p}>
                {d.settings.plans[p.toLowerCase() as "free" | "silver" | "gold"].name}
              </option>
            ))}
          </select>
        </label>
        <label className="w-24">
          <span className="block text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-muted mb-1">
            {a.days}
          </span>
          <input
            name="days"
            inputMode="numeric"
            placeholder="∞"
            className="w-full h-10 rounded-full bg-white border border-line px-3.5 text-[13px] font-bold tabular-nums"
          />
        </label>
        <button
          disabled={pending}
          className="h-10 rounded-full grad-score px-5 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {pending ? a.saving : a.save}
        </button>
      </div>
      <p className="text-[11px] text-muted mt-1.5">{a.daysHint}</p>
      {state.error && (
        <p className="text-[12px] font-bold text-coral mt-1.5">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-[12px] font-bold text-orange mt-1.5">{state.ok}</p>
      )}
    </form>
  );
}
