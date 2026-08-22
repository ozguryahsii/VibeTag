"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  finishLoginAction,
  loginOtpCheckAction,
  resendLoginCodeAction,
} from "@/lib/actions/verify";
import { fill, useD } from "@/components/LocaleProvider";
import { AuthShell } from "@/components/AuthShell";
import { OtpCard } from "@/components/otp/OtpCard";

/** Step two of sign-in: the code from the inbox, in the animated card. */
export function LoginOtpForm({ email }: { email: string }) {
  const d = useD();
  const router = useRouter();
  const [resent, setResent] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, startResend] = useTransition();

  function resend() {
    setResent(null);
    setResendError(null);
    startResend(async () => {
      const result = await resendLoginCodeAction();
      if (result.error) setResendError(result.error);
      else setResent(d.verify.resent);
    });
  }

  return (
    <AuthShell
      kicker={d.otp.loginKicker}
      title={d.otp.loginTitle}
      body={fill(d.otp.loginBody, { email })}
      footer={
        <Link href="/login" className="font-bold text-orange">
          {d.otp.backToLogin}
        </Link>
      }
    >
      <div className="mt-8">
        <OtpCard
          verify={loginOtpCheckAction}
          finish={finishLoginAction}
          onSuccess={(redirect) => {
            router.push(redirect ?? "/home");
            router.refresh();
          }}
        />
        {resendError && (
          <p className="mt-3 text-[13px] font-semibold text-coral">{resendError}</p>
        )}
        {resent && !resendError && (
          <p className="mt-3 text-[13px] font-semibold text-orange">{resent}</p>
        )}
      </div>

      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="mt-4 text-[13.5px] font-bold text-coral disabled:opacity-50"
      >
        {resending ? d.verify.resending : d.verify.resend}
      </button>
      <p className="mt-2 text-[12px] text-muted leading-relaxed">{d.verify.spam}</p>
    </AuthShell>
  );
}
