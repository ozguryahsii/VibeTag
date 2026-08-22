"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
import { useD } from "@/components/LocaleProvider";
import "./otp-animation.css";

/** What the vendored script hangs on window. */
type OtpHandle = {
  reset: () => void;
  destroy: () => void;
};
declare global {
  interface Window {
    OtpAnimation?: {
      mount: (
        card: HTMLElement,
        options: {
          length: number;
          verify: (
            code: string,
          ) => Promise<{ ok: boolean; message?: string; redirect?: string }>;
          onSuccess: (result: { redirect?: string }) => void;
          messages: Record<string, string>;
        },
      ) => OtpHandle;
    };
  }
}

/**
 * The six boxes, the orbit and the seal — the vendored OTP animation
 * (hasib41/otp-verification-v3, MIT; see LICENSE-hasib41.txt) wearing the
 * app's own palette via the CSS variables it exposes.
 *
 * React owns nothing inside the card: `mount()` builds the slots and runs
 * its own state machine, so the wrapper renders once and hands the DOM
 * over. The `verify` prop is a server action — the animation only plays
 * its success sequence when the server said yes.
 */
export function OtpCard({
  verify,
  onSuccess,
}: {
  verify: (
    code: string,
  ) => Promise<{ ok: boolean; message?: string; redirect?: string }>;
  onSuccess: (redirect?: string) => void;
}) {
  const d = useD();
  const cardRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<OtpHandle | null>(null);
  const verifyRef = useRef(verify);
  const successRef = useRef(onSuccess);
  verifyRef.current = verify;
  successRef.current = onSuccess;

  const mount = useCallback(() => {
    if (!cardRef.current || handleRef.current || !window.OtpAnimation) return;
    handleRef.current = window.OtpAnimation.mount(cardRef.current, {
      length: 6,
      verify: (code) => verifyRef.current(code),
      onSuccess: (result) => successRef.current(result.redirect),
      messages: {
        checking: d.otp.anim.checking,
        wrong: d.otp.anim.wrong,
        network: d.otp.anim.network,
        ok: d.otp.anim.ok,
        group: d.otp.anim.group,
        digit: d.otp.anim.digit,
      },
    });
  }, [d]);

  // The script may already be on the page (second visit, fast navigation).
  useEffect(() => {
    mount();
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [mount]);

  return (
    <>
      <Script src="/otp-animation.js" strategy="afterInteractive" onReady={mount} />
      <div ref={cardRef} className="otp-card" data-state="idle">
        <form method="post" action="#" noValidate>
          <div className="code-wrap">
            <div className="code" />
          </div>
          <div className="otp-actions">
            <button
              type="submit"
              className="mt-4 h-13 w-full rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform"
            >
              {d.verify.submit}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
