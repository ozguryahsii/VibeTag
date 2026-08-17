"use client";

import { Wordmark } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";

/**
 * The frame every signed-out screen shares.
 *
 * Sign-in, sign-up, verify, forgotten password and reset all draw the same
 * header and spacing; four copies of it would drift apart the first time the
 * wordmark moved.
 */
export function AuthShell({
  kicker,
  title,
  body,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  body?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh px-6 pt-12 pb-10 flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <Wordmark size={20} />
        <LangToggle />
      </div>
      <p className="mt-11 text-[10px] font-extrabold tracking-[0.28em] text-coral">
        {kicker}
      </p>
      <h1 className="vt-page-title mt-2 text-[34px] tracking-[-0.03em] leading-tight">
        {title}
      </h1>
      {body && <p className="text-[14px] text-muted mt-1.5 leading-relaxed">{body}</p>}

      {children}

      {footer && (
        <div className="mt-auto pt-8 text-center text-[14px] text-muted">
          {footer}
        </div>
      )}
    </main>
  );
}

export function AuthField({
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

/** A six-digit code deserves a box that looks like a six-digit code. */
export function CodeField({
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
        name={props.name ?? "code"}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="••••••"
        className="w-full rounded-[18px] border border-line bg-warmwhite px-4 h-16 text-center text-[30px] font-extrabold tracking-[0.34em] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 transition shadow-[0_8px_24px_rgba(93,58,42,0.035)]"
      />
    </label>
  );
}

export function AuthSubmit({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full h-13 rounded-full grad-score text-white font-bold text-[15px] tracking-[-0.01em] shadow-[0_12px_30px_rgba(255,92,119,0.28)] active:scale-[0.98] transition-transform disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p className="text-[13px] font-semibold text-coral bg-coral/8 border border-coral/20 rounded-2xl px-4 py-3">
      {message}
    </p>
  );
}
