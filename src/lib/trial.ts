import type { Plan } from "@/lib/auth";

/**
 * The free trial: one per person, ever.
 *
 * Not one per plan. Somebody who spends a week on Silver has spent their
 * trial — Gold is then a paid decision, and so is coming back to Silver
 * later. A week of each would be two free weeks handed to anyone who
 * noticed, and the rule exists precisely so that noticing gains nothing.
 *
 * Pure, like `discount.ts` and `store-products.ts`, for the same reason:
 * this decides who gets something for free, and a wrong branch here is
 * invisible until it has already been exploited. It has to be testable
 * without a database.
 */

/** How long a trial runs. Shown in copy; the stores enforce the actual dates. */
export const TRIAL_DAYS = 7;

/** Which plans a trial can be started on at all. */
export const TRIAL_PLANS: Plan[] = ["SILVER", "GOLD"];

export type TrialRecord = {
  trialConsumedAt: Date | null;
  trialPlan: string | null;
};

/** Has this person still got their one trial? */
export function canStartTrial(user: TrialRecord): boolean {
  return user.trialConsumedAt === null;
}

/**
 * What the membership screen should say about the trial, for one plan card.
 *
 * - `OFFER`   — still eligible, and this plan can be trialled: show the badge.
 * - `SPENT`   — the trial is gone. `spentOn` says where it went, so the copy
 *               can be specific rather than a bare refusal.
 * - `NONE`    — this plan has no trial to offer (Free), eligible or not.
 */
export type TrialState =
  | { kind: "OFFER" }
  | { kind: "SPENT"; spentOn: string | null }
  | { kind: "NONE" };

export function trialStateFor(user: TrialRecord, plan: string): TrialState {
  if (!TRIAL_PLANS.includes(plan as Plan)) return { kind: "NONE" };
  if (canStartTrial(user)) return { kind: "OFFER" };
  return { kind: "SPENT", spentOn: user.trialPlan };
}

/**
 * What to write onto the user when a store reports a subscription in its
 * introductory period. Null means "leave the record alone".
 *
 * Only the first one counts. A trial that renews, is re-reported by a
 * webhook, or arrives twice because both the verify endpoint and the webhook
 * saw it must not move the date — otherwise every re-sync would quietly
 * refresh eligibility and the rule would hold for nobody.
 */
export function trialWriteFor(
  ent: { inTrial: boolean },
  plan: Plan,
  user: TrialRecord,
  now: Date,
): { trialConsumedAt: Date; trialPlan: string } | null {
  if (!ent.inTrial) return null;
  if (!canStartTrial(user)) return null;
  return { trialConsumedAt: now, trialPlan: plan };
}
