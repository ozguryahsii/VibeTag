import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import {
  INVITE_PRESETS,
  getShareableInvite,
  inviteStats,
  listInvites,
  type InvitePresetKey,
} from "@/lib/invite";
import { createInviteAction, revokeInviteAction } from "@/lib/actions/invite";
import { baseUrl } from "@/lib/base-url";
import { getVibeProfile } from "@/lib/profile";
import { InviteShare } from "@/components/InviteShare";
import { Card, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  EXPIRED: "Süresi doldu",
  REVOKED: "İptal edildi",
  EXHAUSTED: "Hakkı doldu",
};

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export default async function InvitePageApp() {
  const user = await requireUser();
  const invite = await getShareableInvite(user.id);
  const [{ granted, joined }, invites, profile] = await Promise.all([
    inviteStats(user.id),
    listInvites(user.id),
    getVibeProfile(user.id),
  ]);

  const url = `${await baseUrl()}/i/${invite.code}`;
  const qr = await QRCode.toDataURL(url, {
    width: 512,
    margin: 1,
    color: { dark: "#1F1F1F", light: "#FFF8F5" },
    errorCorrectionLevel: "M",
  });

  return (
    <main className="px-5 pt-10">
      <p className="text-[10px] font-extrabold tracking-[0.24em] text-coral mb-2">
        INVITE
      </p>
      <h1 className="vt-page-title text-[28px] tracking-[-0.02em]">
        Çevreni davet et
      </h1>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        Vibe profilin, seni gerçekten tanıyan insanlarla anlam kazanır. Herkes
        yalnızca seni tanıdığı alanda değerlendirebilir.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[
          [profile.ratingCount, "değerlendirme"],
          [granted, "davet kullanıldı"],
          [joined, "yeni üye"],
        ].map(([n, label]) => (
          <Card key={String(label)} className="!py-4 text-center">
            <div className="text-[22px] font-black grad-text tabular-nums leading-none">
              {n}
            </div>
            <div className="text-[10.5px] text-muted font-semibold mt-1 leading-tight">
              {label}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <SectionTitle>Davet linkin</SectionTitle>
        <InviteShare
          url={url}
          qr={qr}
          name={user.name}
          expiresAt={invite.expiresAt ? fmt(invite.expiresAt) : null}
          remaining={
            invite.maxUses === null
              ? null
              : Math.max(0, invite.maxUses - invite._count.grants)
          }
        />
      </div>

      <div className="mt-7">
        <SectionTitle>Yeni link üret</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {(Object.keys(INVITE_PRESETS) as InvitePresetKey[]).map((k) => (
            <form key={k} action={createInviteAction}>
              <input type="hidden" name="preset" value={k} />
              <button
                type="submit"
                className="w-full rounded-[20px] bg-warmwhite border border-line p-3.5 text-left active:scale-95 transition-transform"
              >
                <span className="block text-[12.5px] font-extrabold">
                  {INVITE_PRESETS[k].label}
                </span>
                <span className="block text-[10.5px] text-muted mt-0.5">
                  {INVITE_PRESETS[k].hint}
                </span>
              </button>
            </form>
          ))}
        </div>
        <p className="text-[11.5px] text-muted mt-2.5 px-1 leading-relaxed">
          Her link ayrı üretilir. Sadece davet ettiklerinden değerlendirme
          alıyorsan, elden ele dolaşan tek bir kalıcı link bu ayarı işlevsiz
          bırakırdı — bu yüzden linkler süreli ve sayılıdır.
        </p>
      </div>

      {invites.length > 0 && (
        <div className="mt-7">
          <SectionTitle>Linklerin</SectionTitle>
          <div className="grid gap-2.5">
            {invites.map((i) => {
              const active = i.status === "ACTIVE";
              return (
                <Card key={i.id} className="!py-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-extrabold truncate">
                        {i.label ?? "Davet linki"}
                      </p>
                      <p className="text-[11.5px] text-muted mt-0.5 font-mono truncate">
                        /i/{i.code}
                      </p>
                      <p className="text-[11.5px] text-muted mt-1">
                        {i._count.grants}
                        {i.maxUses !== null ? `/${i.maxUses}` : ""} kullanım
                        {i.expiresAt ? ` · ${fmt(i.expiresAt)}'e kadar` : " · süresiz"}
                      </p>
                    </div>

                    <span
                      className="text-[10.5px] font-bold rounded-full px-2.5 py-1 shrink-0"
                      style={{
                        color: active ? "#C4562F" : "#8C8177",
                        background: active ? "#FFF0E8" : "#F3EDE7",
                        border: `1px solid ${active ? "#FFDCC6" : "#E9E1D9"}`,
                      }}
                    >
                      {STATUS_LABEL[i.status]}
                    </span>
                  </div>

                  {active && (
                    <form action={revokeInviteAction} className="mt-3">
                      <input type="hidden" name="inviteId" value={i.id} />
                      <button
                        type="submit"
                        className="text-[11.5px] font-bold text-muted underline underline-offset-2"
                      >
                        Bu linki iptal et
                      </button>
                    </form>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-7 mb-2">
        <Card className="grid gap-3">
          <p className="text-[13px] font-extrabold">Nasıl işliyor?</p>
          {[
            "Linki paylaş — açan kişi doğrudan senin değerlendirme sayfana düşer.",
            "Seni nereden tanıdığını seçer; sadece o ilişkiye uygun kriterler açılır.",
            "Cevabı anonim eklenir, sen kimin ne yazdığını görmezsin.",
          ].map((line, i) => (
            <div key={line} className="flex gap-3">
              <span className="w-5 h-5 shrink-0 grid place-items-center rounded-full grad-score text-white text-[11px] font-black">
                {i + 1}
              </span>
              <span className="text-[12.5px] text-muted leading-relaxed">
                {line}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </main>
  );
}
