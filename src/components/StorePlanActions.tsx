"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useD } from "@/components/LocaleProvider";
import { fill } from "@/lib/i18n";
import {
  billingAvailable,
  buy,
  fetchProducts,
  type PurchaseOutcome,
} from "@/components/store-iap";

/**
 * The buy button for one plan, inside the app shell.
 *
 * The price is whatever the store says it is, never our own copy. A store
 * charges in the account's own currency and applies its own rounding, so a
 * hard-coded "₺69/ay" beside a charge in euros is both untrue and a
 * rejection under App Store guideline 3.1.2. If the price cannot be fetched
 * there is nothing honest to show, so the button does not appear — the same
 * reason the web shows prices only with no purchase button beside them.
 */
export function StorePlanActions({
  plan,
  productId,
  active,
}: {
  plan: string;
  productId: string;
  active: boolean;
}) {
  const d = useD();
  const router = useRouter();
  // Three states, not two. "No price yet" and "the store has nothing for this
  // id" look identical on screen, and the second one is a configuration fault
  // somebody has to be told about — a card that silently drops its own buy
  // button is the kind of failure that gets shipped.
  const [price, setPrice] = useState<string | null>(null);
  const [lookup, setLookup] = useState<
    "loading" | "ready" | "empty" | "no-billing"
  >("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLookup("loading");
    // No billing on this device at all — parental controls, a managed
    // device. There is nothing to offer and nothing to explain, so the card
    // stays as it is rather than reporting a fault about a shop that was
    // never open.
    if (!(await billingAvailable())) {
      setLookup("no-billing");
      return;
    }
    const products = await fetchProducts([productId]);
    const found = products.find((p) => p.identifier === productId);
    if (found) {
      setPrice(found.priceString);
      setLookup("ready");
    } else {
      setLookup("empty");
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function purchase() {
    setBusy(true);
    setNote(null);
    const outcome = await buy(productId);
    setBusy(false);
    setNote(messageFor(outcome, d));
    // The plan lives on the server; re-render rather than guess at it here.
    if (outcome.kind === "OK") router.refresh();
  }

  if (active || lookup === "loading" || lookup === "no-billing") return null;

  /*
   * Billing works but the store returned nothing for this id. In production
   * that is a network blip; the rest of the time it is our own configuration
   * — an agreement not active, a product still in Missing Metadata.
   *
   * Silence was the wrong answer: a card with no button reads as "this plan
   * is not for sale", which is a different and untrue statement. A bare
   * apology is not much better, so the message comes with the one action
   * that ever helps.
   */
  if (!price) {
    return (
      <div className="mt-4">
        <p className="text-[12px] text-muted leading-relaxed">
          {d.store.priceUnavailable}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-2 h-9 px-4 rounded-full bg-white border border-line font-bold text-[12.5px] text-muted"
        >
          {d.common.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={purchase}
        disabled={busy}
        className="h-11 w-full rounded-full grad-score text-white font-bold text-[13.5px] disabled:opacity-50"
      >
        {busy
          ? d.common.saving
          : fill(d.store.subscribeFor, { price, plan })}
      </button>
      {note && (
        <p className="mt-2 text-[12px] font-semibold text-coral">{note}</p>
      )}
    </div>
  );
}

type Dict = ReturnType<typeof useD>;

export function messageFor(outcome: PurchaseOutcome, d: Dict): string | null {
  switch (outcome.kind) {
    // A deliberate back-out is not an error, and putting one under the button
    // somebody just dismissed reads as the app arguing with them.
    case "CANCELLED":
      return null;
    case "OK":
      return null;
    case "OTHER_ACCOUNT":
      return d.store.otherAccount;
    case "NOTHING_TO_RESTORE":
      return d.store.nothingToRestore;
    default:
      return d.store.failed;
  }
}
