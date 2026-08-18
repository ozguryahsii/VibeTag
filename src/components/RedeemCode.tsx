"use client";

import { useActionState } from "react";
import { redeemCodeAction, type AdminState } from "@/lib/actions/admin";
import { useD } from "@/components/LocaleProvider";
import { Card } from "@/components/ui";

/**
 * Where a code becomes a plan.
 *
 * Upper-cased as it is typed, because a code is always printed in capitals
 * and a phone keyboard is not. The server normalises again — this is only so
 * what somebody sees matches what they were handed.
 */
export function RedeemCode() {
  const d = useD();
  const [state, action, pending] = useActionState<AdminState, FormData>(
    redeemCodeAction,
    {},
  );
  const a = d.admin.redeem;

  return (
    <Card>
      <p className="text-[13.5px] font-extrabold">{a.title}</p>
      <p className="text-[12px] text-muted leading-relaxed mt-0.5">{a.body}</p>
      <form action={action} className="mt-3 flex gap-2">
        <input
          name="code"
          placeholder={a.placeholder}
          autoCapitalize="characters"
          autoComplete="off"
          className="min-w-0 flex-1 h-11 rounded-full bg-white border border-line px-4 text-[13.5px] font-bold tracking-[0.08em] uppercase"
        />
        <button
          disabled={pending}
          className="h-11 shrink-0 rounded-full grad-premium px-5 text-[13px] font-bold text-white disabled:opacity-50"
        >
          {pending ? a.submitting : a.submit}
        </button>
      </form>
      {state.error && (
        <p className="text-[12.5px] font-bold text-coral mt-2">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-[12.5px] font-bold text-orange mt-2">{state.ok}</p>
      )}
    </Card>
  );
}
