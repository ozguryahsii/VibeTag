"use client";

import { useEffect, useState } from "react";
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
  const [lookup, setLookup] = useState<"loading" | "ready" | "empty">("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!(await billingAvailable())) {
        if (!cancelled) setLookup("empty");
        return;
      }
      const products = await fetchProducts([productId]);
      if (cancelled) return;
      const found = products.find((p) => p.identifier === productId);
      if (found) {
        setPrice(found.priceString);
        setLookup("ready");
      } else {
        setLookup("empty");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function purchase() {
    setBusy(true);
    setNote(null);
    const outcome = await buy(productId);
    setBusy(false);
    setNote(messageFor(outcome, d));
    // The plan lives on the server; re-render rather than guess at it here.
    if (outcome.kind === "OK") router.refresh();
  }

  if (active || lookup === "loading") return null;

  /*
   * The store knows nothing about this product id. Every cause is on the
   * store's side — the paid-apps agreement not active yet, the product not
   * out of "Missing Metadata", a freshly created product Apple has not
   * propagated — and none of them is something the reader can fix. Say the
   * price is unavailable rather than pretending the plan is not for sale.
   */
  if (!price) {
    return (
      <p className="mt-4 text-[12px] text-muted leading-relaxed">
        {d.store.priceUnavailable}
      </p>
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
