import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildVibeProfile } from "@/lib/vibe";
import { Avatar, Card, SectionTitle } from "@/components/ui";
import type { RelationshipKey, TraitKey, VibeTagKey } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await requireUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const users = await prisma.user.findMany({
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
  });

  const ratedByMe = new Set(
    (
      await prisma.rating.findMany({
        where: { raterUserId: me.id },
        select: { ratedUserId: true },
      })
    ).map((r) => r.ratedUserId),
  );

  const rows = users
    .map((u) => ({
      ...u,
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
    .sort((a, b) => b.profile.ratingCount - a.profile.ratingCount);

  return (
    <main className="px-5 pt-10">
      <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">YOUR CIRCLE</p>
      <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">Kişiler</h1>
      <p className="text-[13px] text-muted mt-1">
        Tanıdığın birini bul, ona bir Vibe bırak.
      </p>

      <form className="mt-5">
        <input
          name="q"
          defaultValue={query}
          placeholder="İsim veya kullanıcı adı ara…"
          className="w-full rounded-full border border-line bg-warmwhite px-5 h-13 text-[14.5px] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 transition shadow-[0_10px_30px_rgba(93,58,42,0.04)]"
        />
      </form>

      <div className="mt-6">
        <SectionTitle>{query ? "Sonuçlar" : "Topluluk"}</SectionTitle>

        {rows.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-[14px] font-bold">Kimse bulunamadı</p>
            <p className="text-[12.5px] text-muted mt-1">
              Farklı bir isim deneyebilirsin.
            </p>
          </Card>
        ) : (
          <div className="grid gap-2.5">
            {rows.map((u) => (
              <Link key={u.id} href={`/u/${u.username}`}>
                <Card className="flex items-center gap-3.5 !py-3.5">
                  <Avatar name={u.name}
                    url={u.avatarUrl} color={u.avatarColor} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-extrabold truncate">
                        {u.name}
                      </span>
                      {u.isVerified && <span className="w-4 h-4 grid place-items-center rounded-full grad-score text-white text-[9px] font-black">✓</span>}
                      {ratedByMe.has(u.id) && (
                        <span className="text-[10px] font-bold text-orange bg-tagbg border border-orange/20 rounded-full px-2 py-0.5">
                          Değerlendirdin
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted truncate">
                      @{u.username}
                      {u.profile.ratingCount > 0 &&
                        ` · ${u.profile.ratingCount} değerlendirme`}
                    </p>
                  </div>
                  {u.profile.ratingCount > 0 && (
                    <div className="text-right">
                      <div className="text-[19px] font-black grad-text tabular-nums leading-none">
                        {u.profile.score}
                      </div>
                      <div className="text-[9px] font-bold text-muted tracking-wider">
                        VIBE
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
