"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useD } from "@/components/LocaleProvider";
import { billingAvailable, manage, restore } from "@/components/store-iap";
import { messageFor } from "@/components/StorePlanActions";

/**
 * Restore, manage, and the disclosures that have to sit beside a purchase.
 *
 * "Restore Purchases" is not optional — App Store guideline 3.1.1 requires a
 * way to get back a subscription already paid for, and its absence is one of
 * the most common rejections there is. Somebody who reinstalls, or signs in
 * on a second device, must not be asked to pay twice.
 *
 * The links are required too (3.1.2): terms and privacy, reachable from
 * where the subscription is sold rather than only from a menu.
 */
export function StoreAccountActions({ subscribed }: { subscribed: boolean }) {
  const d = useD();
  const router = useRouter();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void billingAvailable().then(setAvailable);
  }, []);

  async function onRestore() {
    setBusy(true);
    setNote(null);
    const outcome = await restore();
    setBusy(false);
    setNote(outcome.kind === "OK" ? d.store.restored : messageFor(outcome, d));
    if (outcome.kind === "OK") router.refresh();
  }

  if (!available) return null;

  return (
    <div className="mt-3">
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onRestore}
          disabled={busy}
          className="h-11 flex-1 rounded-full bg-white border border-line font-bold text-[13px] text-muted disabled:opacity-50"
        >
          {busy ? d.common.saving : d.store.restore}
        </button>
        {subscribed && (
          <button
            type="button"
            onClick={() => void manage()}
            className="h-11 flex-1 rounded-full bg-white border border-line font-bold text-[13px] text-muted"
          >
            {d.store.manage}
          </button>
        )}
      </div>

      {note && (
        <p className="mt-2 text-[12px] font-semibold text-orange">{note}</p>
      )}

      <p className="mt-3 px-1 text-[11px] text-muted leading-relaxed">
        {d.store.terms}{" "}
        <Link href="/legal/terms" className="font-bold text-orange">
          {d.legal.terms}
        </Link>
        {" · "}
        <Link href="/legal/privacy" className="font-bold text-orange">
          {d.legal.privacy}
        </Link>
      </p>
    </div>
  );
}
