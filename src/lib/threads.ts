/**
 * Who a thread belongs to, and who is hidden inside it.
 *
 * Pure, and deliberately free of any database import: these two rules are
 * what keep anonymity holding, and a rule that cannot be tested is a rule
 * that quietly stops being true. `social.ts` re-exports them so callers need
 * not know they moved.
 */

/** Conversation ids are stored with the lower user id first. */
export function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export type ThreadKind = "FRIEND" | "RATING";

/**
 * Which row a thread lives in.
 *
 * The pair *and* the kind. Two people can hold two conversations — the one
 * they have as friends, and the anonymous one that grew out of a rating — and
 * those must never be the same row. Keyed on the pair alone, whichever was
 * created first swallowed the other, so pressing "message" beside a friend's
 * name opened their anonymous thread and told you who the anonymous rater
 * was without printing a single name.
 */
export function threadKey(
  meId: string,
  otherId: string,
  kind: ThreadKind,
): { userAId: string; userBId: string; kind: ThreadKind } {
  const [userAId, userBId] = pairKey(meId, otherId);
  return { userAId, userBId, kind };
}

/**
 * Is the person on the other end of this thread shown as Anonymous to me?
 *
 * One function rather than the same ternary written out at every place that
 * renders a thread. Anonymity breaks silently — nothing on screen looks wrong
 * when it stops holding — so the rule gets one home and a test.
 */
export function hidesOther(
  convo: { userAId: string; anonymousSide: string | null },
  meId: string,
): boolean {
  const otherSide = convo.userAId === meId ? "B" : "A";
  return convo.anonymousSide === otherSide;
}
