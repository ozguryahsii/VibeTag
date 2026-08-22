"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type FormState } from "@/lib/actions/auth";
import { Wordmark } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { useD } from "@/components/LocaleProvider";

const initial: FormState = {};

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-[11px] font-extrabold tracking-[0.12em] uppercase text-muted mb-2 ml-1">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-[18px] border border-line bg-warmwhite px-4 h-13 text-[15px] font-medium outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 transition shadow-[0_8px_24px_rgba(93,58,42,0.035)]"
      />
    </label>
  );
}

function Submit({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="w-full h-13 rounded-full grad-score text-white font-bold text-[15px] tracking-[-0.01em] shadow-[0_12px_30px_rgba(255,92,119,0.28)] active:scale-[0.98] transition-transform"
    >
      {label}
    </button>
  );
}

export function LoginForm() {
  const d = useD();
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <main className="min-h-dvh px-6 pt-12 pb-10 flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <Wordmark size={20} />
        <LangToggle />
      </div>
      <p className="mt-11 text-[10px] font-extrabold tracking-[0.28em] text-coral">
        {d.auth.loginKicker}
      </p>
      <h1 className="vt-page-title mt-2 text-[34px] tracking-[-0.03em] leading-tight">
        {d.auth.loginTitle}
      </h1>
      <p className="text-[14px] text-muted mt-1.5">{d.auth.loginBody}</p>

      <form action={action} className="mt-8 grid gap-4 relative">
        {/* Not type="email": a username is a perfectly good answer here, and
            the browser would refuse to submit one. */}
        <Field
          label={d.auth.identifier}
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder={d.auth.identifierPlaceholder}
          required
        />
        <Field
          label={d.auth.password}
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••"
          required
        />
        {state.error && (
          <p className="text-[13px] font-semibold text-coral bg-coral/8 border border-coral/20 rounded-2xl px-4 py-3">
            {state.error}
          </p>
        )}
        <div className="mt-1">
          <Submit label={pending ? d.auth.signingIn : d.auth.signIn} />
        </div>
        <Link
          href="/forgot"
          className="text-center text-[13px] font-bold text-coral"
        >
          {d.forgot.link}
        </Link>
      </form>

      <p className="mt-auto pt-8 text-center text-[14px] text-muted">
        {d.auth.noAccount}{" "}
        <Link href="/register" className="font-bold text-orange">
          {d.auth.signUp}
        </Link>
      </p>
    </main>
  );
}

export function RegisterForm() {
  const d = useD();
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <main className="min-h-dvh px-6 pt-12 pb-10 flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <Wordmark size={20} />
        <LangToggle />
      </div>
      <p className="mt-11 text-[10px] font-extrabold tracking-[0.28em] text-coral">
        {d.auth.registerKicker}
      </p>
      <h1 className="vt-page-title mt-2 text-[34px] tracking-[-0.03em] leading-tight">
        {d.auth.registerTitle}
      </h1>
      <p className="text-[14px] text-muted mt-1.5">{d.auth.registerBody}</p>

      <form action={action} className="mt-8 grid gap-4">
        <Field
          label={d.auth.name}
          name="name"
          placeholder={d.auth.namePlaceholder}
          required
        />
        <Field
          label={d.auth.username}
          name="username"
          placeholder="ozguryahsi"
          required
        />
        <Field
          label={d.auth.email}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={d.auth.emailPlaceholder}
          required
        />
        <Field
          label={d.auth.password}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={d.auth.passwordHint}
          required
        />
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 w-5 h-5 shrink-0 accent-[#FF5C77]"
          />
          <span className="text-[12.5px] text-muted leading-relaxed">
            {d.auth.consentPrefix}{" "}
            <Link href="/legal/privacy" target="_blank" className="font-bold text-orange">
              {d.legal.privacy}
            </Link>
            {", "}
            <Link href="/legal/kvkk" target="_blank" className="font-bold text-orange">
              {d.legal.kvkk}
            </Link>{" "}
            {d.auth.consentAnd}{" "}
            <Link href="/legal/terms" target="_blank" className="font-bold text-orange">
              {d.legal.terms}
            </Link>
            {d.auth.consentSuffix}
          </span>
        </label>
        {state.error && (
          <p className="text-[13px] font-semibold text-coral bg-coral/8 border border-coral/20 rounded-2xl px-4 py-3">
            {state.error}
          </p>
        )}
        <div className="mt-1">
          <Submit label={pending ? d.auth.creating : d.auth.createAccount} />
        </div>
      </form>

      <p className="mt-auto pt-8 text-center text-[14px] text-muted">
        {d.auth.haveAccount}{" "}
        <Link href="/login" className="font-bold text-orange">
          {d.auth.signIn}
        </Link>
      </p>
    </main>
  );
}
