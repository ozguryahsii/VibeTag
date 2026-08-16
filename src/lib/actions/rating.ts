"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { evaluateRating } from "@/lib/fraud";
import { hasInviteGrant } from "@/lib/invite";
import { moderateComment } from "@/lib/moderation";
import { notify } from "@/lib/notifications";
import { awardAndNotify } from "@/lib/awards";
import { cooldownDaysLeft } from "@/lib/rating-rules";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { traitLabel } from "@/lib/labels";
import {
  MAX_VIBE_TAGS_PER_RATING,
  MIN_VIBE_TAGS_PER_RATING,
  RELATIONSHIPS,
  VIBE_TAGS,
  assertAllowed,
  isRelationshipKey,
  isVibeTagKey,
  type VibeTagKey,
} from "@/lib/taxonomy";

export type RatingState = {
  error?: string;
  ok?: boolean;
  username?: string;
  /**
   * Whether this call revised an existing rating. The success screen cannot
   * infer it from props: finishing the action refreshes the route, so by the
   * time it renders, the rating it just created is already "existing".
   */
  updated?: boolean;
};

export async function submitRatingAction(
  _prev: RatingState,
  formData: FormData,
): Promise<RatingState> {
  const d = await getDict();
  const locale = await getLocale();

  let rater;
  try {
    rater = await requireUser();
  } catch {
    return { error: d.rating.errors.signIn };
  }

  const username = String(formData.get("username") ?? "").toLowerCase();
  const relationship = String(formData.get("relationship") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const hideIdentity = formData.get("hideIdentity") === "on";

  if (!isRelationshipKey(relationship)) {
    return { error: d.rating.errors.pickContext };
  }

  const rated = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, name: true, ratingPolicy: true },
  });
  if (!rated) return { error: d.rating.errors.noUser };
  if (rated.id === rater.id) {
    return { error: d.rating.errors.self };
  }

  // ---- consent checks, before anything else is read
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: rated.id, blockedId: rater.id },
        { blockerId: rater.id, blockedId: rated.id },
      ],
    },
    select: { blockerId: true },
  });
  if (blocked) {
    return {
      error:
        blocked.blockerId === rater.id
          ? d.rating.errors.youBlocked
          : d.rating.errors.theyBlocked,
    };
  }

  if (
    rated.ratingPolicy === "INVITED" &&
    !(await hasInviteGrant(rater.id, rated.id))
  ) {
    return {
      error: fill(d.rating.errors.inviteOnly, {
        name: rated.name.split(" ")[0],
      }),
    };
  }

  // ---- collect traits (every trait of the relationship must be scored)
  const expected = RELATIONSHIPS[relationship].traits;
  const traits: { traitKey: string; score: number }[] = [];
  for (const key of expected) {
    const raw = formData.get(`trait:${key}`);
    const score = Number(raw);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return { error: d.rating.errors.scoreAll };
    }
    traits.push({ traitKey: key, score });
  }

  // ---- collect vibe tags
  const tags = formData
    .getAll("tags")
    .map(String)
    .filter((t, i, arr) => isVibeTagKey(t) && arr.indexOf(t) === i);

  if (tags.length < MIN_VIBE_TAGS_PER_RATING) {
    return { error: d.rating.errors.minTags };
  }
  if (tags.length > MAX_VIBE_TAGS_PER_RATING) {
    return {
      error: fill(d.rating.errors.maxTags, { max: MAX_VIBE_TAGS_PER_RATING }),
    };
  }

  // ---- the trust guard: context gates what may be said
  const guard = assertAllowed(
    relationship,
    traits.map((t) => t.traitKey),
    tags,
  );
  if (!guard.ok) {
    // Named in the reader's language, so the guard explains itself instead of
    // just refusing.
    const label =
      guard.kind === "trait"
        ? traitLabel(guard.key, locale)
        : (VIBE_TAGS[guard.key as VibeTagKey]?.en ?? guard.key);
    return {
      error: fill(
        guard.kind === "trait"
          ? d.rating.errors.notAllowedTrait
          : d.rating.errors.notAllowedTag,
        { label },
      ),
    };
  }

  if (comment.length > 280) {
    return { error: d.rating.errors.commentLong };
  }
  const moderation = moderateComment(comment);
  if (!moderation.ok) return { error: d.moderation[moderation.reason] };

  const existing = await prisma.rating.findUnique({
    where: { ratedUserId_raterUserId: { ratedUserId: rated.id, raterUserId: rater.id } },
    include: { traits: true, vibeTags: true },
  });

  const verdict = await evaluateRating({
    raterUserId: rater.id,
    ratedUserId: rated.id,
    scores: traits.map((t) => t.score),
  });

  if (!existing) {
    await prisma.rating.create({
      data: {
        ratedUserId: rated.id,
        raterUserId: rater.id,
        relationship,
        comment: comment || null,
        hideIdentity,
        isProtected: verdict.isProtected,
        fraudFlags: JSON.stringify(verdict.flags),
        weight: verdict.weight,
        traits: { create: traits },
        vibeTags: { create: tags.map((tagKey) => ({ tagKey })) },
      },
    });

    // Never says who — that would undo the anonymity the product runs on.
    await notify(rated.id, "NEW_RATING", { href: "/home" });
  } else {
    // §8 — one revision per 30 days, and the old version is archived.
    const daysLeft = cooldownDaysLeft(existing.lastUpdatedAt);
    if (daysLeft > 0) {
      return { error: fill(d.rating.errors.cooldown, { n: daysLeft }) };
    }

    const snapshot = JSON.stringify({
      relationship: existing.relationship,
      comment: existing.comment,
      hideIdentity: existing.hideIdentity,
      traits: existing.traits.map((t) => ({
        traitKey: t.traitKey,
        score: t.score,
      })),
      vibeTags: existing.vibeTags.map((t) => t.tagKey),
      weight: existing.weight,
    });

    await prisma.$transaction([
      prisma.ratingRevision.create({
        data: {
          ratingId: existing.id,
          version: existing.updateCount + 1,
          snapshot,
        },
      }),
      prisma.ratingTrait.deleteMany({ where: { ratingId: existing.id } }),
      prisma.ratingVibeTag.deleteMany({ where: { ratingId: existing.id } }),
      prisma.rating.update({
        where: { id: existing.id },
        data: {
          relationship,
          comment: comment || null,
          hideIdentity,
          isProtected: verdict.isProtected,
          fraudFlags: JSON.stringify(verdict.flags),
          weight: verdict.weight,
          updateCount: { increment: 1 },
          lastUpdatedAt: new Date(),
          traits: { create: traits },
          vibeTags: { create: tags.map((tagKey) => ({ tagKey })) },
        },
      }),
    ]);

    await notify(rated.id, "RATING_UPDATED", { href: "/home" });
  }

  // A rating can push someone over a badge threshold. Checked after both
  // paths because an update moves the numbers just as much as a new rating.
  await awardAndNotify(rated.id);

  revalidatePath(`/u/${rated.username}`);
  revalidatePath("/home");
  revalidatePath("/insights");
  return { ok: true, username: rated.username, updated: !!existing };
}
