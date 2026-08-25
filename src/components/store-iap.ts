"use client";

/**
 * In-app purchases, from the web page's side of the shell.
 *
 * Reached through `window.Capacitor.Plugins.NativePurchases` rather than an
 * import, for the same reason push is: the app loads this site over
 * `server.url`, the native runtime injects the plugin proxies, and importing
 * the npm wrapper would drag a native-only dependency into the web bundle
 * for code that can never run there.
 *
 * Nothing here decides what somebody is entitled to. The purchase happens on
 * the device, the receipt handle goes to `/api/store/verify`, and the server
 * asks Apple or Google directly — a client that could grant itself Gold by
 * saying so would be a client worth lying to.
 */

export type StoreProduct = {
  identifier: string;
  /** Already formatted in the store's currency for this account. */
  priceString: string;
};

type Transaction = {
  transactionId?: string;
  purchaseToken?: string;
  productIdentifier?: string;
};

type PurchasesPlugin = {
  isBillingSupported: () => Promise<{ isBillingSupported: boolean }>;
  getProducts: (opts: {
    productIdentifiers: string[];
    productType?: string;
  }) => Promise<{ products: Array<Record<string, unknown>> }>;
  purchaseProduct: (opts: {
    productIdentifier: string;
    productType?: string;
  }) => Promise<Transaction>;
  restorePurchases: () => Promise<void>;
  getPurchases: (opts?: {
    productType?: string;
  }) => Promise<{ purchases: Transaction[] }>;
  manageSubscriptions: () => Promise<void>;
};

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: { NativePurchases?: PurchasesPlugin };
};

const SUBS = "subs";

function capacitor(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  const c = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  return c?.isNativePlatform?.() ? c : null;
}

export function purchases(): PurchasesPlugin | null {
  return capacitor()?.Plugins?.NativePurchases ?? null;
}

export function storePlatform(): "APPLE" | "GOOGLE" {
  return capacitor()?.getPlatform?.() === "android" ? "GOOGLE" : "APPLE";
}

/**
 * The handle the server needs to look this purchase up.
 *
 * Apple wants a transaction id — its own endpoint accepts any transaction in
 * the subscription and answers with the whole history — and Google wants the
 * purchase token. Different strings, different services, so the platform
 * decides rather than a guess at which field is populated.
 */
export function receiptHandle(txn: Transaction): string | null {
  const value =
    storePlatform() === "GOOGLE" ? txn.purchaseToken : txn.transactionId;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function billingAvailable(): Promise<boolean> {
  const plugin = purchases();
  if (!plugin) return false;
  try {
    return (await plugin.isBillingSupported()).isBillingSupported;
  } catch {
    return false;
  }
}

/**
 * Prices, as the store itself formats them.
 *
 * Never our own copy: the store charges in the account's own currency, and a
 * hard-coded "₺69/ay" beside a charge in euros is both a lie and a rejection
 * (App Store guideline 3.1.2). If the fetch fails there is no price to show,
 * so the caller shows none.
 */
export async function fetchProducts(ids: string[]): Promise<StoreProduct[]> {
  const plugin = purchases();
  if (!plugin || ids.length === 0) return [];
  try {
    const { products } = await plugin.getProducts({
      productIdentifiers: ids,
      productType: SUBS,
    });
    return products.flatMap((p) => {
      const identifier = String(p.identifier ?? p.productIdentifier ?? "");
      const priceString = String(p.priceString ?? p.localizedPrice ?? "");
      return identifier && priceString ? [{ identifier, priceString }] : [];
    });
  } catch {
    return [];
  }
}

export type PurchaseOutcome =
  | { kind: "OK"; plan: string }
  | { kind: "CANCELLED" }
  | { kind: "NOTHING_TO_RESTORE" }
  | { kind: "OTHER_ACCOUNT" }
  | { kind: "FAILED" };

/** Hand a receipt to the server and let it decide what the purchase is worth. */
async function claim(handle: string): Promise<PurchaseOutcome> {
  const res = await fetch("/api/store/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ platform: storePlatform(), token: handle }),
  });
  if (res.ok) {
    const body = (await res.json()) as { plan?: string };
    return { kind: "OK", plan: String(body.plan ?? "") };
  }
  // 409 is the one worth naming: this Apple ID already pays for a different
  // Vibe Tag account, and "something went wrong" would send somebody looking
  // for a fault that is not there.
  if (res.status === 409) return { kind: "OTHER_ACCOUNT" };
  return { kind: "FAILED" };
}

export async function buy(productId: string): Promise<PurchaseOutcome> {
  const plugin = purchases();
  if (!plugin) return { kind: "FAILED" };

  let txn: Transaction;
  try {
    txn = await plugin.purchaseProduct({
      productIdentifier: productId,
      productType: SUBS,
    });
  } catch (error) {
    // Tapping "Cancel" on the platform sheet throws, and treating that as a
    // failure would put an error under a button somebody deliberately backed
    // out of.
    const message = String((error as { message?: string })?.message ?? error);
    if (/cancel/i.test(message)) return { kind: "CANCELLED" };
    return { kind: "FAILED" };
  }

  const handle = receiptHandle(txn);
  if (!handle) return { kind: "FAILED" };
  try {
    return await claim(handle);
  } catch {
    return { kind: "FAILED" };
  }
}

/**
 * Restore purchases.
 *
 * Required by App Store guideline 3.1.1 — somebody who reinstalls, or signs
 * in on a second device, must be able to get back what they already paid for
 * without paying again. It is the same server call as a fresh purchase: the
 * verify endpoint is idempotent precisely so that this needs no separate
 * path.
 */
export async function restore(): Promise<PurchaseOutcome> {
  const plugin = purchases();
  if (!plugin) return { kind: "FAILED" };

  try {
    await plugin.restorePurchases();
    const { purchases: found } = await plugin.getPurchases({
      productType: SUBS,
    });
    const handles = found.flatMap((t) => {
      const h = receiptHandle(t);
      return h ? [h] : [];
    });
    if (handles.length === 0) return { kind: "NOTHING_TO_RESTORE" };

    // Somebody may hold more than one subscription in the group's history.
    // Claim them all and report the best outcome; the server decides which
    // one actually grants anything.
    let best: PurchaseOutcome = { kind: "NOTHING_TO_RESTORE" };
    for (const handle of handles) {
      const outcome = await claim(handle);
      if (outcome.kind === "OK") return outcome;
      if (outcome.kind === "OTHER_ACCOUNT") best = outcome;
    }
    return best;
  } catch {
    return { kind: "FAILED" };
  }
}

/** Open the platform's own subscription management screen. */
export async function manage(): Promise<void> {
  try {
    await purchases()?.manageSubscriptions();
  } catch {
    // Not worth an error message: the same screen is two taps away in
    // Settings, and the button is a convenience.
  }
}
