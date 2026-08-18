"use client";

import { useActionState } from "react";
import { createCodeAction, type AdminState } from "@/lib/actions/admin";
import { useD } from "@/components/LocaleProvider";
import { Card } from "@/components/ui";

const FIELD =
  "w-full h-11 rounded-[14px] bg-white border border-line px-3.5 text-[13.5px]";
const LABEL =
  "block text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-muted mb-1";

/**
 * Make a code.
 *
 * Every field except the plan is optional, and empty means "no limit"
 * everywhere — a code with nothing filled in is a permanent, unlimited Gold
 * key, which is the thing you actually want when handing one to a partner.
 */
export function CodeForm() {
  const d = useD();
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createCodeAction,
    {},
  );
  const a = d.admin.codes;

  return (
    <Card>
      <p className="text-[13.5px] font-extrabold mb-3">{a.newTitle}</p>
      <form action={action} className="grid gap-3">
        <label>
          <span className={LABEL}>{a.code}</span>
          <input
            name="code"
            placeholder={a.codePlaceholder}
            autoCapitalize="characters"
            className={`${FIELD} font-bold tracking-[0.08em] uppercase`}
          />
        </label>

        <label>
          <span className={LABEL}>{a.note}</span>
          <input name="note" placeholder={a.notePlaceholder} className={FIELD} />
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          <label>
            <span className={LABEL}>{a.plan}</span>
            <select name="plan" defaultValue="GOLD" className={`${FIELD} font-bold`}>
              <option value="GOLD">{d.settings.plans.gold.name}</option>
              <option value="SILVER">{d.settings.plans.silver.name}</option>
            </select>
          </label>
          <label>
            <span className={LABEL}>{a.days}</span>
            <input
              name="days"
              inputMode="numeric"
              placeholder="∞"
              className={`${FIELD} tabular-nums`}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <label>
            <span className={LABEL}>{a.maxUses}</span>
            <input
              name="maxUses"
              inputMode="numeric"
              placeholder="∞"
              className={`${FIELD} tabular-nums`}
            />
          </label>
          <label>
            <span className={LABEL}>{a.expiresAt}</span>
            <input name="expiresAt" type="date" className={FIELD} />
          </label>
        </div>

        <p className="text-[11px] text-muted leading-relaxed -mt-1">
          {a.daysHint} {a.maxUsesHint}
        </p>

        <button
          disabled={pending}
          className="h-11 rounded-full grad-score text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {pending ? a.creating : a.create}
        </button>

        {state.error && (
          <p className="text-[12.5px] font-bold text-coral">{state.error}</p>
        )}
        {state.ok && (
          <p className="text-[12.5px] font-bold text-orange">{state.ok}</p>
        )}
      </form>
    </Card>
  );
}
