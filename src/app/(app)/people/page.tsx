import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { listFriendRequests, listFriends } from "@/lib/social";
import {
  openFriendThreadAction,
  removeFriendAction,
  requestFriendAction,
  respondFriendAction,
} from "@/lib/actions/social";
import { buildVibeProfile } from "@/lib/vibe";
import { distanceKm, FAR_KM } from "@/lib/geo";
import { disableLocationAction } from "@/lib/actions/location";
import { NearbyToggle } from "@/components/NearbyToggle";
import { Avatar } from "@/components/Avatar";
import { LangToggle } from "@/components/LangToggle";
import { Card, SectionTitle } from "@/components/ui";
import type { RelationshipKey, TraitKey, VibeTagKey } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await requireUser();
  const d = await getDict();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [me2, users, friends, requests, mine, pendingOut] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me.id },
      select: { shareLocation: true, lat: true, lng: true },
    }),
    prisma.user.findMany({
      where: {
        id: { not: me.id },
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { username: { contains: query.toLowerCase() } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        avatarColor: true,
        isVerified: true,
        shareLocation: true,
        lat: true,
        lng: true,
        ratingsReceived: {
          select: {
            relationship: true,
            weight: true,
            createdAt: true,
            traits: { select: { traitKey: true, score: true } },
            vibeTags: { select: { tagKey: true } },
          },
        },
      },
      take: 40,
    }),
    listFriends(me.id),
    listFriendRequests(me.id),
    prisma.rating.findMany({
      where: { raterUserId: me.id },
      select: { ratedUserId: true },
    }),
    prisma.friendship.findMany({
      where: { requesterId: me.id, status: "PENDING" },
      select: { addresseeId: true },
    }),
  ]);

  const ratedByMe = new Set(mine.map((r) => r.ratedUserId));
  const friendIds = new Set(friends.map((f) => f.id));
  const requestedIds = new Set(pendingOut.map((f) => f.addresseeId));

  const nearbyOn = !!me2?.shareLocation && me2.lat !== null && me2.lng !== null;

  const rows = users
    .map((u) => ({
      ...u,
      // Only people who also opted in get a distance; everyone else simply
      // has none and falls to the bottom of the list.
      distance:
        nearbyOn && u.shareLocation && u.lat !== null && u.lng !== null
          ? distanceKm(me2!.lat!, me2!.lng!, u.lat, u.lng)
          : null,
      profile: buildVibeProfile(
        u.ratingsReceived.map((r) => ({
          id: "",
          relationship: r.relationship as RelationshipKey,
          weight: r.weight,
          createdAt: r.createdAt,
          traits: r.traits.map((t) => ({
            traitKey: t.traitKey as TraitKey,
            score: t.score,
          })),
          vibeTags: r.vibeTags.map((t) => ({ tagKey: t.tagKey as VibeTagKey })),
        })),
      ),
    }))
    // Friends already have their own section above; do not list them twice.
    .filter((u) => !friendIds.has(u.id))
    .sort((a, b) => {
      // Nearby first when we can measure it, then the busiest profiles.
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return b.profile.ratingCount - a.profile.ratingCount;
    });

  function distanceLabel(km: number): string {
    if (km >= FAR_KM) return d.people.distanceFar;
    if (km < 1) return d.people.distanceClose;
    return fill(d.people.distanceKm, { n: Math.round(km) });
  }

  return (
    <main className="px-5 pt-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {d.people.kicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">
            {d.people.title}
          </h1>
          <p className="text-[13px] text-muted mt-1">{d.people.subtitle}</p>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>

      <form className="mt-5">
        <input
          name="q"
          defaultValue={query}
          placeholder={d.people.search}
          className="w-full rounded-full border border-line bg-warmwhite px-5 h-13 text-[14.5px] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 transition shadow-[0_10px_30px_rgba(93,58,42,0.04)]"
        />
      </form>

      {/* Incoming requests sit above everything — they need an answer. */}
      {requests.length > 0 && (
        <div className="mt-6">
          <SectionTitle>{d.people.requests}</SectionTitle>
          <div className="grid gap-2.5">
            {requests.map((r) => (
              <Card key={r.id} className="flex items-center gap-3.5 !py-3.5">
                <Avatar
                  name={r.requester.name}
                  url={r.requester.avatarUrl}
                  color={r.requester.avatarColor}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold truncate">
                    {r.requester.name}
                  </p>
                  <p className="text-[11.5px] text-muted">{d.people.incoming}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={respondFriendAction}>
                    <input type="hidden" name="friendshipId" value={r.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <button className="text-[12px] font-bold text-white grad-score rounded-full px-3.5 py-2">
                      {d.people.accept}
                    </button>
                  </form>
                  <form action={respondFriendAction}>
                    <input type="hidden" name="friendshipId" value={r.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <button className="text-[12px] font-bold text-muted bg-white border border-line rounded-full px-3.5 py-2">
                      {d.people.decline}
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Friends first: rating someone you know should be one tap. */}
      <div className="mt-6">
        <SectionTitle>{d.people.friends}</SectionTitle>
        {friends.length === 0 ? (
          <Card className="!py-5">
            <p className="text-[12.5px] text-muted leading-relaxed">
              {d.people.friendsEmpty}
            </p>
          </Card>
        ) : (
          <div className="grid gap-2.5">
            {friends.map((f) => (
              <Card key={f.id} className="flex items-center gap-3.5 !py-3.5">
                <Link href={`/u/${f.username}`} className="shrink-0">
                  <Avatar
                    name={f.name}
                    url={f.avatarUrl}
                    color={f.avatarColor}
                    size={44}
                  />
                </Link>
                <Link href={`/u/${f.username}`} className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold truncate">{f.name}</p>
                  <p className="text-[11.5px] text-muted truncate">
                    @{f.username}
                  </p>
                </Link>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex gap-2">
                    <form action={openFriendThreadAction}>
                      <input type="hidden" name="username" value={f.username} />
                      <button
                        className="text-[12px] font-bold text-muted bg-white border border-line rounded-full px-3.5 py-2"
                        aria-label={d.people.message}
                      >
                        {d.people.message}
                      </button>
                    </form>
                    {!ratedByMe.has(f.id) && (
                      <Link
                        href={`/rate/${f.username}`}
                        className="text-[12px] font-bold text-white grad-score rounded-full px-3.5 py-2"
                      >
                        {d.rate.rateCta}
                      </Link>
                    )}
                  </div>
                  {/*
                   * Unfriending sits below the primary actions and stays
                   * quiet: it is rare, it is destructive, and it should not
                   * compete for the thumb with "Message".
                   */}
                  <form action={removeFriendAction}>
                    <input
                      type="hidden"
                      name="username"
                      value={f.username}
                    />
                    <button
                      className="text-[10.5px] font-semibold text-muted/70 px-1"
                      title={d.people.removeFriend}
                    >
                      {d.common.remove}
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-7">
        {nearbyOn ? (
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <p className="text-[11.5px] text-muted leading-relaxed">
              {d.people.nearbyBody}
            </p>
            <form action={disableLocationAction} className="shrink-0">
              <button className="text-[11.5px] font-bold text-muted underline underline-offset-2">
                {d.people.nearbyDisable}
              </button>
            </form>
          </div>
        ) : (
          <div className="mb-4">
            <NearbyToggle />
          </div>
        )}

        <SectionTitle>
          {query
            ? d.people.results
            : nearbyOn
              ? d.people.nearby
              : d.people.community}
        </SectionTitle>

        {rows.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-[14px] font-bold">{d.people.noneTitle}</p>
            <p className="text-[12.5px] text-muted mt-1">{d.people.noneBody}</p>
          </Card>
        ) : (
          <div className="grid gap-2.5">
            {rows.map((u) => (
              <Card key={u.id} className="flex items-center gap-3.5 !py-3.5">
                <Link href={`/u/${u.username}`} className="shrink-0">
                  <Avatar
                    name={u.name}
                    url={u.avatarUrl}
                    color={u.avatarColor}
                    size={46}
                  />
                </Link>

                <Link href={`/u/${u.username}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14.5px] font-extrabold truncate">
                      {u.name}
                    </span>
                    {u.isVerified && (
                      <span className="w-4 h-4 grid place-items-center rounded-full grad-score text-white text-[9px] font-black">
                        ✓
                      </span>
                    )}
                    {ratedByMe.has(u.id) && (
                      <span className="text-[10px] font-bold text-orange bg-tagbg border border-orange/20 rounded-full px-2 py-0.5">
                        {d.people.youRated}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted truncate">
                    @{u.username}
                    {u.profile.ratingCount > 0 &&
                      ` · ${fill(d.people.ratingsCount, { n: u.profile.ratingCount })}`}
                  </p>
                  {u.distance !== null && (
                    <p className="text-[11px] font-bold text-orange mt-0.5">
                      📍 {distanceLabel(u.distance)}
                    </p>
                  )}
                </Link>

                {requestedIds.has(u.id) ? (
                  <span className="shrink-0 text-[11px] font-bold text-muted">
                    {d.people.requestSent}
                  </span>
                ) : (
                  <form action={requestFriendAction} className="shrink-0">
                    <input type="hidden" name="username" value={u.username} />
                    <button
                      className="text-[12px] font-bold text-orange bg-tagbg border border-orange/20 rounded-full px-3 py-2"
                      aria-label={d.people.addFriend}
                    >
                      +
                    </button>
                  </form>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
