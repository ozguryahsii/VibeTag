import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMyRatingOf, getUserByUsername } from "@/lib/profile";
import { cooldownDaysLeft } from "@/lib/rating-rules";
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
              hideIdentity: existing.hideIdentity,
              updateCount: existing.updateCount,
              cooldownDaysLeft: cooldownDaysLeft(existing.lastUpdatedAt),
            }
          : null
      }
    />
  );
}
