import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMyRatingOf, getUserByUsername } from "@/lib/profile";
import { cooldownDaysLeft, ratingAllowed } from "@/lib/rating-rules";
import { hasInviteGrant } from "@/lib/invite";
import { areFriends } from "@/lib/social";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { RateFlow } from "@/components/RateFlow";

export default async function RateUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const me = await requireUser();
  const { username } = await params;

  const target = await getUserByUsername(username);
  if (!target) notFound();
  if (target.id === me.id) redirect("/home");

  // The rated person's door, decided before the flow renders: a closed
  // profile shows a closed door, not an error after five screens of tapping.
  // The action checks the same rule again on submit.
  const allowed = ratingAllowed(target.ratingPolicy, {
    invited: await hasInviteGrant(me.id, target.id),
    friends: await areFriends(me.id, target.id),
  });

  if (!allowed) {
    const d = await getDict();
    const firstName = target.name.split(" ")[0];
    const paused = target.ratingPolicy === "NOBODY";
    return (
      <main className="px-5 pt-14 pb-10">
        <div className="card p-6 text-center">
          <p className="text-[15px] font-extrabold">
            {paused
              ? fill(d.rateFlow.pausedTitle, { name: firstName })
              : fill(d.rateFlow.circleOnlyTitle, { name: firstName })}
          </p>
          <p className="text-[13px] text-muted leading-relaxed mt-2">
            {paused ? d.rateFlow.pausedBody : d.rateFlow.circleOnlyBody}
          </p>
          <Link
            href={`/u/${target.username}`}
            className="mt-5 inline-grid h-11 px-6 place-items-center rounded-full bg-white border border-line text-[13.5px] font-bold"
          >
            {d.common.back}
          </Link>
        </div>
      </main>
    );
  }

  const existing = await getMyRatingOf(me.id, target.id);

  return (
    <RateFlow
      target={{
        name: target.name,
        username: target.username,
        avatarUrl: target.avatarUrl,
        avatarColor: target.avatarColor,
      }}
      existing={
        existing
          ? {
              relationship: existing.relationship,
              traits: existing.traits,
              tags: existing.tags,
              comment: existing.comment,
              updateCount: existing.updateCount,
              cooldownDaysLeft: cooldownDaysLeft(existing.lastUpdatedAt),
            }
          : null
      }
    />
  );
}
