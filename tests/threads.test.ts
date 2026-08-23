import { describe, expect, it } from "vitest";
import { hidesOther, pairKey, threadKey } from "@/lib/threads";

/**
 * Anonymity (§15) is the product.
 *
 * A rating is never attributed in the UI. That holds only as long as nothing
 * *else* attributes it — and for a while something did: a pair of people had
 * exactly one conversation row, so the friend thread and the anonymous rating
 * thread were the same thread. Pressing "message" beside a friend's name
 * opened a window headed "Anonymous", which named the rater by navigation;
 * opening a rating thread with an existing friend printed their real name.
 *
 * Both break silently. Nothing on screen looks wrong when they stop holding.
 */
describe("threads", () => {
  const alice = "aaa";
  const bob = "zzz";

  it("keeps a friend thread and a rating thread apart", () => {
    const friend = threadKey(alice, bob, "FRIEND");
    const rating = threadKey(alice, bob, "RATING");

    // Same two people, same row order — and still two different rows.
    expect(friend.userAId).toBe(rating.userAId);
    expect(friend.userBId).toBe(rating.userBId);
    expect(friend.kind).not.toBe(rating.kind);
    expect(JSON.stringify(friend)).not.toBe(JSON.stringify(rating));
  });

  it("gives both people the same row whichever way round they ask", () => {
    expect(threadKey(alice, bob, "RATING")).toEqual(
      threadKey(bob, alice, "RATING"),
    );
    expect(pairKey(bob, alice)).toEqual([alice, bob]);
  });

  it("hides the rater from the person they rated, and nobody else", () => {
    // Alice is side A and wrote the rating, so Alice is the hidden one.
    const convo = { userAId: alice, anonymousSide: "A" };

    expect(hidesOther(convo, bob)).toBe(true); // Bob sees "Anonymous"
    expect(hidesOther(convo, alice)).toBe(false); // Alice sees Bob
  });

  it("hides nobody in a thread with no anonymous side", () => {
    // What a friend thread looks like, and what a Gold member's rating thread
    // looks like: a rater exists, but they are not hidden from this reader.
    const convo = { userAId: alice, anonymousSide: null };
    expect(hidesOther(convo, bob)).toBe(false);
    expect(hidesOther(convo, alice)).toBe(false);
  });
});
