import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction, setPlanAction } from "@/lib/actions/auth";
import { setRatingPolicyAction, toggleBlockAction } from "@/lib/actions/safety";
import { ProfileEditor } from "@/components/ProfileEditor";
import { DeleteAccount } from "@/components/DeleteAccount";
import { Avatar } from "@/components/Avatar";
import { Card, SectionTitle } from "@/components/ui";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "₺0",
    tagline: "My Vibe",
    perks: ["My Vibe profili", "Vibe Score ve Vibe Tags", "Vibe Card oluşturma"],
  },
  {
    key: "SILVER",
    name: "Silver",
    price: "₺79/ay",
    tagline: "Vibe Insights",
    perks: [
      "Seni hangi çevrelerden tanıyorlar",
      "Güçlü yönler ve gelişim alanları",
      "Anonim oy detayları",
    ],
  },
  {
    key: "GOLD",
    name: "Gold",
    price: "₺149/ay",
    tagline: "Vibe Identity",
    perks: [
      "Silver'daki her şey",
      "Kim değerlendirdi, nereden tanıyor",
      "Korunan oylar yine anonim kalır",
    ],
  },
] as const;

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const blocks = await prisma.block.findMany({
    where: { blockerId: user.id },
    select: {
      id: true,
      blocked: {
        select: { name: true, username: true, avatarUrl: true, avatarColor: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="px-5 pt-10">
      <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">YOUR VIBE IDENTITY</p>
      <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">Profil</h1>
      <p className="text-[13px] text-muted mt-1">
        @{user.username} · {user.email}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <Link
          href={`/u/${user.username}`}
          className="card !py-4 text-center text-[12.5px] font-bold"
        >
          Profilim
        </Link>
        <Link
          href="/card"
          className="card !py-4 text-center text-[12.5px] font-bold"
        >
          Vibe Card
        </Link>
        <Link
          href="/invite"
          className="card !py-4 text-center text-[12.5px] font-bold"
        >
          Davet et
        </Link>
      </div>

      <div className="mt-6">
        <SectionTitle>Profilini düzenle</SectionTitle>
        <ProfileEditor
          name={user.name}
          bio={user.bio ?? ""}
          avatarUrl={user.avatarUrl}
          avatarColor={user.avatarColor}
        />
      </div>

      <div className="mt-7">
        <SectionTitle>Üyelik</SectionTitle>
        <div className="grid gap-2.5">
          {PLANS.map((p) => {
            const active = user.plan === p.key;
            return (
              <div
                key={p.key}
                className={`rounded-[26px] p-5 ${
                  active ? "grad-ring" : "bg-warmwhite border border-line"
                }`}
                style={{
                  boxShadow: active
                    ? "0 12px 34px rgba(255,138,61,0.16)"
                    : undefined,
                }}
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[16px] font-black">{p.name}</span>
                    <span className="text-[12px] font-bold text-coral ml-2">
                      {p.tagline}
                    </span>
                  </div>
                  <span className="text-[14px] font-extrabold">{p.price}</span>
                </div>

                <ul className="mt-3 grid gap-1.5">
                  {p.perks.map((perk) => (
                    <li
                      key={perk}
                      className="text-[12.5px] text-muted flex gap-2"
                    >
                      <span className="text-orange">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>

                {active ? (
                  <p className="mt-4 text-[12.5px] font-bold text-orange">
                    Aktif planın
                  </p>
                ) : (
                  <form action={setPlanAction} className="mt-4">
                    <input type="hidden" name="plan" value={p.key} />
                    <button
                      type="submit"
                      className="h-11 w-full rounded-full font-bold text-[14px] text-white active:scale-[0.98] transition-transform grad-score"
                    >
                      {p.key === "FREE" ? "Free'ye dön" : `${p.name}'a geç`}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11.5px] text-muted mt-3 px-1 leading-relaxed">
          Demo sürümünde plan değişimi anında ve ücretsizdir — gerçek uygulamada
          bu akış ödeme sağlayıcısına bağlanır.
        </p>
      </div>

      <div className="mt-7">
        <SectionTitle>Gizlilik ve güvenlik</SectionTitle>

        <Card className="grid gap-3">
          <div>
            <p className="text-[13.5px] font-extrabold">
              Seni kimler değerlendirebilir?
            </p>
            <p className="text-[12px] text-muted leading-relaxed mt-0.5">
              Kapalı moda geçersen yalnızca senin davet linkinle katılmış
              kişiler değerlendirme yapabilir.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { key: "EVERYONE", label: "Herkes", hint: "Açık profil" },
              { key: "INVITED", label: "Davet ettiklerim", hint: "Kapalı çevre" },
            ].map((opt) => {
              const active = user.ratingPolicy === opt.key;
              return (
                <form key={opt.key} action={setRatingPolicyAction}>
                  <input type="hidden" name="ratingPolicy" value={opt.key} />
                  <button
                    type="submit"
                    className={`w-full rounded-[20px] p-3.5 text-left ${
                      active ? "grad-ring" : "bg-cream border border-line"
                    }`}
                  >
                    <span className="block text-[13px] font-bold">
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-muted mt-0.5">
                      {opt.hint}
                    </span>
                  </button>
                </form>
              );
            })}
          </div>
        </Card>

        <Card className="grid gap-3 mt-2.5">
          {[
            ["Tüm oylar anonimdir", "Kimin ne yazdığı profilinde asla görünmez."],
            ["Korunan değerlendirmeler", "Şüpheli görülen oyların kimliği Gold üyelikte de gizli kalır."],
            ["Güncelleme geçmişi", "Bir değerlendirme güncellendiğinde eski sürümü kayıt altına alınır."],
            ["Bağlam kilidi", "Kimse seni tanımadığı bir alanda değerlendiremez."],
            ["Engelleme", "Engellediğin kişi yeni değerlendirme yapamaz. Mevcut değerlendirmesi silinmez — aksi hâlde engelleme, düşük puanları temizleme aracına dönerdi. Haksız bulduğun değerlendirmeyi bildirebilirsin."],
          ].map(([t, d]) => (
            <div key={t}>
              <span className="block text-[13px] font-bold">{t}</span>
              <span className="block text-[12px] text-muted leading-relaxed mt-0.5">
                {d}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <div className="mt-7">
        <SectionTitle>Engellediklerin</SectionTitle>
        {blocks.length === 0 ? (
          <Card className="!py-5 text-center">
            <p className="text-[13px] text-muted">
              Kimseyi engellemedin.
            </p>
          </Card>
        ) : (
          <div className="grid gap-2.5">
            {blocks.map((b) => (
              <Card key={b.id} className="flex items-center gap-3.5 !py-3.5">
                <Avatar
                  name={b.blocked.name}
                  url={b.blocked.avatarUrl}
                  color={b.blocked.avatarColor}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-extrabold truncate">
                    {b.blocked.name}
                  </p>
                  <p className="text-[11.5px] text-muted">@{b.blocked.username}</p>
                </div>
                <form action={toggleBlockAction}>
                  <input type="hidden" name="username" value={b.blocked.username} />
                  <button
                    type="submit"
                    className="text-[12px] font-bold text-orange rounded-full px-3.5 py-2 bg-tagbg border border-orange/20"
                  >
                    Kaldır
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-7">
        <SectionTitle>Hesap</SectionTitle>
        <div className="grid gap-2.5">
          <DeleteAccount username={user.username} />
        </div>
      </div>

      <form action={logoutAction} className="mt-6 mb-2">
        <button
          type="submit"
          className="w-full h-12 rounded-full bg-white border border-line text-[14px] font-bold text-muted active:scale-[0.98] transition-transform"
        >
          Çıkış yap
        </button>
      </form>
    </main>
  );
}
