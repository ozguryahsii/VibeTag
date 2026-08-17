"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  confirmResetAction,
  requestResetAction,
} from "@/lib/actions/verify";
import type { FormState } from "@/lib/actions/auth";
import { useD } from "@/components/LocaleProvider";
import {
  AuthError,
  AuthField,
  AuthShell,
  AuthSubmit,
  CodeField,
} from "@/components/AuthShell";

/**
 * Step one of a reset: say who you are.
 *
 * The confirmation is the same whether or not an account was found. Telling
 * somebody "no account with that address" turns this form into a way of
 * discovering who has an account here.
 */
export function ForgotForm() {
  const d = useD();
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestResetAction,
    {},
  );
  const [identifier, setIdentifier] = useState("");

  if (state.ok) {
    return (
      <AuthShell
        kicker={d.forgot.kicker}
        title={d.forgot.sentTitle}
        body={d.forgot.sentBody}
        footer={
          <Link href="/login" className="font-bold text-orange">
            {d.forgot.backToLogin}
          </Link>
        }
      >
        <div className="mt-8">
          <Link
            href={`/reset?id=${encodeURIComponent(identifier)}`}
            className="block w-full h-13 leading-[3.25rem] text-center rounded-full grad-score text-white font-bold text-[15px] shadow-[0_12px_30px_rgba(255,92,119,0.28)]"
          >
            {d.forgot.haveCode}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker={d.forgot.kicker}
      title={d.forgot.title}
      body={d.forgot.body}
      footer={
        <Link href="/login" className="font-bold text-orange">
          {d.forgot.backToLogin}
        </Link>
      }
    >
      <form action={action} className="mt-8 grid gap-4">
        <AuthField
          label={d.auth.identifier}
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder={d.auth.identifierPlaceholder}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        {state.error && <AuthError message={state.error} />}
        <div className="mt-1">
          <AuthSubmit
            label={pending ? d.forgot.submitting : d.forgot.submit}
            disabled={pending}
          />
        </div>
      </form>
    </AuthShell>
  );
}

/** Step two: the code, and the password to use from now on. */
export function ResetForm({ identifier }: { identifier: string }) {
  const d = useD();
  const [state, action, pending] = useActionState<FormState, FormData>(
    confirmResetAction,
    {},
  );

  return (
    <AuthShell
      kicker={d.reset.kicker}
      title={d.reset.title}
      body={d.reset.body}
      footer={
        <Link href="/forgot" className="font-bold text-orange">
          {d.forgot.link}
        </Link>
      }
    >
      <form action={action} className="mt-8 grid gap-4">
        <AuthField
          label={d.auth.identifier}
          name="identifier"
          type="text"
          autoComplete="username"
          defaultValue={identifier}
          required
        />
        <CodeField label={d.verify.code} required />
        <AuthField
          label={d.reset.newPassword}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••"
          required
        />
        <p className="text-[12px] text-muted leading-relaxed ml-1">
          {d.reset.signedOutNote}
        </p>
        {state.error && <AuthError message={state.error} />}
        <div className="mt-1">
          <AuthSubmit
            label={pending ? d.reset.submitting : d.reset.submit}
            disabled={pending}
          />
        </div>
      </form>
    </AuthShell>
  );
}
