import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cooldownDaysLeft } from "@/lib/rating-rules";
import { Avatar, Card, EmptyState, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RatePickerPage() {
  const me = await requireUser();

  const [users, mine] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: me.id } },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        avatarColor: true,
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.rating.findMany({
      where: { raterUserId: me.id },
      select: { ratedUserId: true, lastUpdatedAt: true, updateCount: true },
    }),
  ]);

  const mineMap = new Map(mine.map((r) => [r.ratedUserId, r]));
  const fresh = users.filter((u) => !mineMap.has(u.id));
  const rated = users.filter((u) => mineMap.has(u.id));

  return (
    <main className="px-5 pt-10">
      <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">LEAVE A VIBE</p>
      <h1 className="vt-page-title text-[31px] tracking-[-0.02em] leading-[1.08]">
        Kimi değerlendireceksin?
      </h1>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        Her kişiyi <b className="text-ink">bir kez</b> değerlendirebilirsin.
        Değerlendirmeni ayda bir güncelleyebilirsin.
      </p>

      <div className="mt-6">
        <SectionTitle>Henüz değerlendirmedin</SectionTitle>
        {fresh.length === 0 ? (
          <EmptyState
            emoji="✓"
            title="Herkesi değerlendirdin"
            body="Çevrendeki yeni kişiler katıldığında burada görünecekler."
          />
        ) : (
          <div className="grid gap-2.5">
            {fresh.map((u) => (
              <Link key={u.id} href={`/rate/${u.username}`} className="block min-w-0">
                <Card className="min-w-0 flex items-center gap-3.5 !py-3.5">
                  <Avatar name={u.name}
                    url={u.avatarUrl} color={u.avatarColor} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-extrabold truncate">
                      {u.name}
                    </p>
                    <p className="text-[12px] text-muted truncate">
                      {u.bio ?? `@${u.username}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] font-bold text-white grad-score rounded-full px-4 py-2">
                    Değerlendir
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {rated.length > 0 && (
        <div className="mt-7">
          <SectionTitle>Değerlendirdiklerin</SectionTitle>
          <div className="grid gap-2.5">
            {rated.map((u) => {
              const r = mineMap.get(u.id)!;
              const days = cooldownDaysLeft(r.lastUpdatedAt);
              return (
                <Link key={u.id} href={`/rate/${u.username}`} className="block min-w-0">
                  <Card className="min-w-0 flex items-center gap-3.5 !py-3.5 opacity-90">
                    <Avatar
                      name={u.name}
                    url={u.avatarUrl}
                      color={u.avatarColor}
                      size={42}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold truncate">
                        {u.name}
                      </p>
                      <p className="text-[11.5px] text-muted">
                        {days > 0
                          ? `${days} gün sonra güncellenebilir`
                          : "Şimdi güncelleyebilirsin"}
                        {r.updateCount > 0 && ` · ${r.updateCount} güncelleme`}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[11.5px] font-bold rounded-full px-3 py-1.5"
                      style={{
                        color: days > 0 ? "#6B6B6B" : "#FF8A3D",
                        background: days > 0 ? "#F5F0EA" : "#FFF0E8",
                        border: `1px solid ${days > 0 ? "#E9E1D9" : "#FFE3D2"}`,
                      }}
                    >
                      {days > 0 ? "Kilitli" : "Güncelle"}
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
