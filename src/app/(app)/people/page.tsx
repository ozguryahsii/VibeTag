import Link from "next/link";
import { hasPlan, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";
import { fill, type Dictionary } from "@/lib/i18n";
import { listFriendRequests, listFriends } from "@/lib/social";
import { RemoveFriend } from "@/components/RemoveFriend";
import {
  cancelFriendRequestAction,
  openFriendThreadAction,
  requestFriendAction,
  respondFriendAction,
} from "@/lib/actions/social";
import { buildVibeProfile } from "@/lib/vibe";
import { distanceKm, FAR_KM } from "@/lib/geo";
import { disableLocationAction } from "@/lib/actions/location";
import { NearbyToggle } from "@/components/NearbyToggle";
import { Avatar } from "@/components/Avatar";
import { LangToggle } from "@/components/LangToggle";
import { IconGlyph } from "@/components/Icon";
import { ICONS } from "@/lib/icons";
import { Card, SectionTitle } from "@/components/ui";
import { nameSearch } from "@/lib/search";
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
  const searching = query.length > 0;

  const [me2, users, friends, requests, mine, pendingOut] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me.id },
      select: { shareLocation: true, lat: true, lng: true },
    }),
    prisma.user.findMany({
      where: {
        id: { not: me.id },
        ...(searching ? { OR: nameSearch(query) } : {}),
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
  // Sharing your location is free — it is what makes you visible to others.
  // Seeing the nearby list yourself is the paid half of the feature, so a
  // Free viewer's rows simply never get a distance.
  const canSeeNearby = hasPlan(me, "SILVER");
  const nearbyVisible = nearbyOn && canSeeNearby;

  const rows = users
    .map((u) => ({
      ...u,
      // Only people who also opted in get a distance; everyone else simply
      // has none and falls to the bottom of the list.
      distance:
        nearbyVisible && u.shareLocation && u.lat !== null && u.lng !== null
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
    /*
     * Friends are excluded from the community list because they already have
     * their own section — but never from search results. Searching a friend's
     * name and being told "nobody found" is simply wrong, and it was.
     */
    .filter((u) => searching || !friendIds.has(u.id))
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

  /* Results when searching; the community browse list otherwise. */
  const list = (
    <div>
      <SectionTitle
        action={
          searching ? (
            <Link
              href="/people"
              className="text-[12px] font-bold text-muted underline underline-offset-2"
            >
              {d.people.searchClear}
            </Link>
          ) : undefined
        }
      >
        {searching
          ? fill(d.people.resultsFor, { q: query })
          : nearbyVisible
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

              {/*
               * A friend turning up in results should offer the thing you can
               * actually do with them, not an "add friend" button for a
               * friendship that already exists.
               */}
              {friendIds.has(u.id) ? (
                <form action={openFriendThreadAction} className="shrink-0">
                  <input type="hidden" name="username" value={u.username} />
                  <button className="text-[12px] font-bold text-orange bg-tagbg border border-orange/20 rounded-full px-3.5 py-2">
                    {d.people.message}
                  </button>
                </form>
              ) : requestedIds.has(u.id) ? (
                <form action={cancelFriendRequestAction} className="shrink-0">
                  <input type="hidden" name="username" value={u.username} />
                  <button className="text-[11px] font-bold text-muted bg-white border border-line rounded-full px-3 py-2">
                    {d.people.requestSent}
                  </button>
                </form>
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
  );

  const incoming = requests.length > 0 && (
    <div>
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
  );

  const friendList = (
    <div>
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
              <div className="flex items-center gap-2 shrink-0">
                {/* One family of pills — the same box, ink and type as the
                    "+" in the list below, so the two sections read as one. */}
                <form action={openFriendThreadAction}>
                  <input type="hidden" name="username" value={f.username} />
                  <button
                    className="text-[12px] font-bold text-orange bg-tagbg border border-orange/20 rounded-full px-3.5 py-2"
                    aria-label={d.people.message}
                  >
                    {d.people.message}
                  </button>
                </form>
                {!ratedByMe.has(f.id) && (
                  <Link
                    href={`/rate/${f.username}`}
                    className="text-[12px] font-bold text-orange bg-tagbg border border-orange/20 rounded-full px-3.5 py-2"
                  >
                    {d.rate.rateCta}
                  </Link>
                )}
                <RemoveFriend name={f.name} username={f.username} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const nearbyControls = nearbyOn ? (
    <div className="card p-5">
      <p className="text-[13.5px] font-extrabold">{d.people.nearby}</p>
      <p className="text-[12px] text-muted leading-relaxed mt-1">
        {d.people.nearbyBody}
      </p>
      <form action={disableLocationAction}>
        <button className="mt-3.5 h-11 w-full rounded-full grad-score text-white font-bold text-[13.5px] active:scale-[0.98] transition-transform">
          {d.people.nearbyDisable}
        </button>
      </form>
    </div>
  ) : (
    <NearbyToggle />
  );

  /* Location on, plan Free: they are visible to premium members but cannot
     see the list themselves. Said plainly, next to the way in. */
  const nearbyLocked = nearbyOn && !canSeeNearby && (
    <div className="card p-5">
      <p className="text-[13.5px] font-extrabold">{d.people.nearbyLockedTitle}</p>
      <p className="text-[12px] text-muted leading-relaxed mt-1">
        {d.people.nearbyLockedBody}
      </p>
      <Link
        href="/settings"
        className="mt-3.5 inline-flex h-10 items-center rounded-full grad-premium px-5 text-[12.5px] font-bold text-white"
      >
        {d.people.nearbyLockedCta}
      </Link>
    </div>
  );

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

      <SearchBar query={query} d={d} />

      {/*
       * When you have searched, the answer comes first — scrolling past your
       * whole friends list to reach it is the wrong way round. With no query
       * the order inverts: the people waiting on you, then the people you
       * know, then everyone else.
       */}
      <div className="mt-6 grid gap-7">
        {searching ? (
          <>
            {list}
            {incoming}
            {friendList}
          </>
        ) : (
          <>
            {incoming}
            {friendList}
            <div className="grid gap-4">
              {nearbyControls}
              {nearbyLocked}
              {list}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SearchBar({ query, d }: { query: string; d: Dictionary }) {
  return (
    <form className="mt-5 relative">
      <input
        name="q"
        defaultValue={query}
        placeholder={d.people.search}
        // Extra right padding keeps the text clear of the button.
        className="w-full rounded-full border border-line bg-warmwhite pl-5 pr-14 h-13 text-[14.5px] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 transition shadow-[0_10px_30px_rgba(93,58,42,0.04)]"
      />
      {/*
       * Enter already submitted the form, but on a phone keyboard that is not
       * obvious and on iOS the key is easy to miss. A visible target says the
       * search is a thing you press.
       */}
      <button
        type="submit"
        aria-label={d.people.searchGo}
        className="absolute right-1.5 top-1.5 w-10 h-10 grid place-items-center rounded-full grad-score shadow-[0_6px_16px_rgba(255,92,119,0.32)] active:scale-95 transition-transform"
      >
        <IconGlyph def={ICONS.search} size={18} color="#fff" strokeWidth={2.2} />
      </button>
    </form>
  );
}
