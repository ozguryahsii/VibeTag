"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { evaluateRating } from "@/lib/fraud";
import { hasInviteGrant } from "@/lib/invite";
import { moderateComment } from "@/lib/moderation";
import { notify } from "@/lib/notifications";
import { cooldownDaysLeft } from "@/lib/rating-rules";
import {
  MAX_VIBE_TAGS_PER_RATING,
  MIN_VIBE_TAGS_PER_RATING,
  RELATIONSHIPS,
  assertAllowed,
  isRelationshipKey,
  isVibeTagKey,
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
  let rater;
  try {
    rater = await requireUser();
  } catch {
    return { error: "Değerlendirme yapmak için giriş yapmalısın." };
  }

  const username = String(formData.get("username") ?? "").toLowerCase();
  const relationship = String(formData.get("relationship") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const hideIdentity = formData.get("hideIdentity") === "on";

  if (!isRelationshipKey(relationship)) {
    return { error: "Önce bu kişiyi nereden tanıdığını seçmelisin." };
  }

  const rated = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, name: true, ratingPolicy: true },
  });
  if (!rated) return { error: "Kullanıcı bulunamadı." };
  if (rated.id === rater.id) {
    return { error: "Kendini değerlendiremezsin." };
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
          ? "Bu kişiyi engellemişsin. Değerlendirmek için engeli kaldırman gerek."
          : "Bu kişiyi şu anda değerlendiremezsin.",
    };
  }

  if (
    rated.ratingPolicy === "INVITED" &&
    !(await hasInviteGrant(rater.id, rated.id))
  ) {
    return {
      error: `${rated.name.split(" ")[0]} yalnızca davet ettiği kişilerden değerlendirme alıyor. Ondan geçerli bir davet linki istemen gerek.`,
    };
  }

  // ---- collect traits (every trait of the relationship must be scored)
  const expected = RELATIONSHIPS[relationship].traits;
  const traits: { traitKey: string; score: number }[] = [];
  for (const key of expected) {
    const raw = formData.get(`trait:${key}`);
    const score = Number(raw);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return { error: "Tüm kriterleri 1-5 arasında puanlamalısın." };
    }
    traits.push({ traitKey: key, score });
  }

  // ---- collect vibe tags
  const tags = formData
    .getAll("tags")
    .map(String)
    .filter((t, i, arr) => isVibeTagKey(t) && arr.indexOf(t) === i);

  if (tags.length < MIN_VIBE_TAGS_PER_RATING) {
    return { error: "En az 1 Vibe Tag seçmelisin." };
  }
  if (tags.length > MAX_VIBE_TAGS_PER_RATING) {
    return { error: `En fazla ${MAX_VIBE_TAGS_PER_RATING} Vibe Tag seçebilirsin.` };
  }

  // ---- the trust guard: context gates what may be said
  const guard = assertAllowed(
    relationship,
    traits.map((t) => t.traitKey),
    tags,
  );
  if (!guard.ok) return { error: guard.error };

  if (comment.length > 280) {
    return { error: "Yorum en fazla 280 karakter olabilir." };
  }
  const moderation = moderateComment(comment);
  if (!moderation.ok) return { error: moderation.error };

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
    await notify(
      rated.id,
      "NEW_RATING",
      "Yeni bir değerlendirme aldın ✨",
      "Biri seni değerlendirdi. My Vibe profilin güncellendi.",
      "/home",
    );
  } else {
    // §8 — one revision per 30 days, and the old version is archived.
    const daysLeft = cooldownDaysLeft(existing.lastUpdatedAt);
    if (daysLeft > 0) {
      return {
        error: `Değerlendirmeni ayda bir kez güncelleyebilirsin. ${daysLeft} gün sonra tekrar deneyebilirsin.`,
      };
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

    await notify(
      rated.id,
      "RATING_UPDATED",
      "Bir değerlendirmen güncellendi",
      "Daha önce seni değerlendiren biri görüşünü güncelledi.",
      "/home",
    );
  }

  revalidatePath(`/u/${rated.username}`);
  revalidatePath("/home");
  revalidatePath("/insights");
  return { ok: true, username: rated.username, updated: !!existing };
}
