/**
 * When to ask somebody to turn notifications on.
 *
 * iOS gives an app **one** chance to show the system permission dialog. Once
 * it is answered "no", the app can never show it again — the person has to
 * find Settings → Vibe Tag → Notifications on their own, which nobody does.
 * So the system dialog is never opened directly: we ask first, in our own
 * card, and only open it for somebody who already said yes.
 *
 * That makes "not now" free, which is the whole point — and it makes *when*
 * we ask a decision worth writing down rather than guessing at each call
 * site. Pure so the schedule can be tested without a browser or a phone.
 */

/** How the platform currently stands on notifications for this install. */
export type PushPermission = "prompt" | "granted" | "denied";

export type PromptMemory = {
  /** How many times the soft ask has been dismissed. */
  dismissals: number;
  /** When the last dismissal happened, epoch ms. Null if never. */
  lastDismissedAt: number | null;
};

export const EMPTY_MEMORY: PromptMemory = { dismissals: 0, lastDismissedAt: null };

/** How long to leave somebody alone after they say "not now". */
export const QUIET_DAYS = 3;

/** After this many refusals, stop asking and leave the settings toggle. */
export const MAX_ASKS = 2;

export function shouldAsk(
  permission: PushPermission,
  memory: PromptMemory,
  now: number,
): boolean {
  // Nothing to ask for: already on, or already refused at the system level
  // where our card cannot help anyway.
  if (permission !== "prompt") return false;

  if (memory.dismissals === 0) return true;
  // Asking twice in one session is nagging, and nagging is how a soft ask
  // turns into the hard "no" it exists to avoid.
  if (memory.dismissals >= MAX_ASKS) return false;
  if (memory.lastDismissedAt === null) return true;

  return now - memory.lastDismissedAt >= QUIET_DAYS * 24 * 60 * 60 * 1000;
}

/** The memory to store after somebody dismisses the card. */
export function afterDismiss(memory: PromptMemory, now: number): PromptMemory {
  return { dismissals: memory.dismissals + 1, lastDismissedAt: now };
}

/**
 * Read the memory back out of whatever localStorage returned.
 *
 * Anything unparseable is treated as "never asked": a corrupt value must not
 * silence the prompt forever, and it must not crash the screen it sits on.
 */
export function parseMemory(raw: string | null): PromptMemory {
  if (!raw) return EMPTY_MEMORY;
  try {
    const value = JSON.parse(raw) as Partial<PromptMemory>;
    const dismissals =
      typeof value.dismissals === "number" && value.dismissals >= 0
        ? Math.floor(value.dismissals)
        : 0;
    const lastDismissedAt =
      typeof value.lastDismissedAt === "number" && value.lastDismissedAt > 0
        ? value.lastDismissedAt
        : null;
    return { dismissals, lastDismissedAt };
  } catch {
    return EMPTY_MEMORY;
  }
}

export const PROMPT_STORAGE_KEY = "vt_push_prompt";
