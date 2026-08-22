import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMyRatingOf, getUserByUsername } from "@/lib/profile";
import { commentAllowed, cooldownDaysLeft } from "@/lib/rating-rules";
import { hasInviteGrant } from "@/lib/invite";
import { areFriends } from "@/lib/social";
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

  const existing = await getMyRatingOf(me.id, target.id);

  // The note is the rated person's to gate — decided here so the flow can
  // show a closed door instead of an error after typing.
  const canComment = commentAllowed(target.commentPolicy, {
    invited: await hasInviteGrant(me.id, target.id),
    friends: await areFriends(me.id, target.id),
  });

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
      canComment={canComment}
    />
  );
}
