import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction, setPlanAction } from "@/lib/actions/auth";
import { ProfileEditor } from "@/components/ProfileEditor";
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

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <main className="px-5 pt-12">
      <h1 className="text-[27px] font-black tracking-[-0.02em]">Profil</h1>
      <p className="text-[13px] text-muted mt-1">
        @{user.username} · {user.email}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Link
          href={`/u/${user.username}`}
          className="card !py-4 text-center text-[13.5px] font-bold"
        >
          👀 Profilim
        </Link>
        <Link
          href="/card"
          className="card !py-4 text-center text-[13.5px] font-bold"
        >
          🪪 Vibe Card
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
                className={`rounded-[24px] p-5 ${
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
                    <span className="text-[12px] font-bold text-purple ml-2">
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
                      className={`h-11 w-full rounded-full font-bold text-[14px] text-white active:scale-[0.98] transition-transform ${
                        p.key === "GOLD" ? "grad-premium" : "grad-score"
                      }`}
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
        <SectionTitle>Gizlilik</SectionTitle>
        <Card className="grid gap-3">
          {[
            ["🕶️", "Tüm oylar anonimdir", "Kimin ne yazdığı profilinde asla görünmez."],
            ["🔒", "Korunan değerlendirmeler", "Şüpheli görülen oyların kimliği Gold üyelikte de gizli kalır."],
            ["📝", "Güncelleme geçmişi", "Bir değerlendirme güncellendiğinde eski sürümü kayıt altına alınır."],
            ["🎯", "Bağlam kilidi", "Kimse seni tanımadığı bir alanda değerlendiremez."],
          ].map(([e, t, d]) => (
            <div key={t} className="flex gap-3">
              <span className="text-lg">{e}</span>
              <span>
                <span className="block text-[13px] font-bold">{t}</span>
                <span className="block text-[12px] text-muted leading-relaxed">
                  {d}
                </span>
              </span>
            </div>
          ))}
        </Card>
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
