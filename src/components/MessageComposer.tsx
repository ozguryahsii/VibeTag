"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction, type SocialState } from "@/lib/actions/social";

export function MessageComposer({
  conversationId,
  placeholder,
  sendLabel,
  sendingLabel,
}: {
  conversationId: string;
  placeholder: string;
  sendLabel: string;
  sendingLabel: string;
}) {
  const [state, action, pending] = useActionState<SocialState, FormData>(
    sendMessageAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex gap-2.5">
        <input
          name="body"
          autoComplete="off"
          maxLength={1000}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-line bg-warmwhite px-5 h-12 text-[14px] outline-none focus:border-orange/60 focus:ring-4 focus:ring-orange/10 transition"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-12 px-5 rounded-full grad-score text-white font-bold text-[13.5px] disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {pending ? sendingLabel : sendLabel}
        </button>
      </div>
      {state.error && (
        <p className="mt-2.5 text-[12.5px] font-semibold text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
