"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { confirmEmailAction, resendCodeAction } from "@/lib/actions/verify";
import { logoutAction, type FormState } from "@/lib/actions/auth";
import { fill, useD } from "@/components/LocaleProvider";
import {
  AuthError,
  AuthShell,
  AuthSubmit,
  CodeField,
} from "@/components/AuthShell";

/**
 * The verify screen, in both of its moods.
 *
 * `required` is a new account that cannot use the app yet; the same screen
 * with `required` false is somebody who already had an account and chose to
 * verify. Only the copy and the escape hatch differ, so it is one component —
 * two would drift, and the drift would land on whichever mood is rarer.
 */
export function VerifyForm({
  email,
  required,
}: {
  email: string;
  required: boolean;
}) {
  const d = useD();
  const [state, action, pending] = useActionState<FormState, FormData>(
    confirmEmailAction,
    {},
  );
  const [resent, setResent] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, startResend] = useTransition();

  function resend() {
    setResent(null);
    setResendError(null);
    startResend(async () => {
      const result = await resendCodeAction();
      if (result.error) setResendError(result.error);
      else setResent(d.verify.resent);
    });
  }

  return (
    <AuthShell
      kicker={d.verify.kicker}
      title={required ? d.verify.title : d.verify.voluntaryTitle}
      body={fill(required ? d.verify.body : d.verify.voluntaryBody, { email })}
      footer={
        required ? (
          <>
            {d.verify.wrongAccount}{" "}
            <form action={logoutAction} className="inline">
              <button type="submit" className="font-bold text-orange">
                {d.verify.signOut}
              </button>
            </form>
          </>
        ) : (
          <Link href="/settings" className="font-bold text-orange">
            {d.verify.later}
          </Link>
        )
      }
    >
      <form action={action} className="mt-8 grid gap-4">
        <CodeField label={d.verify.code} required autoFocus />

        {(state.error || resendError) && (
          <AuthError message={state.error ?? resendError ?? ""} />
        )}
        {resent && !resendError && (
          <p className="text-[13px] font-semibold text-orange">{resent}</p>
        )}

        <div className="mt-1">
          <AuthSubmit
            label={pending ? d.verify.submitting : d.verify.submit}
            disabled={pending}
          />
        </div>
      </form>

      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="mt-4 text-[13.5px] font-bold text-coral disabled:opacity-50"
      >
        {resending ? d.verify.resending : d.verify.resend}
      </button>
      <p className="mt-2 text-[12px] text-muted leading-relaxed">
        {d.verify.spam}
      </p>
    </AuthShell>
  );
}
