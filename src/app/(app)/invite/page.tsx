import { headers } from "next/headers";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { getOrCreatePrimaryInvite, inviteStats } from "@/lib/invite";
import { getVibeProfile } from "@/lib/profile";
import { InviteShare } from "@/components/InviteShare";
import { Card, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function InvitePageApp() {
  const user = await requireUser();
  const invite = await getOrCreatePrimaryInvite(user.id);
  const { joined } = await inviteStats(user.id);
  const profile = await getVibeProfile(user.id);

  const url = `${await baseUrl()}/i/${invite.code}`;
  const qr = await QRCode.toDataURL(url, {
    width: 512,
    margin: 1,
    color: { dark: "#1F1F1F", light: "#FFF8F5" },
    errorCorrectionLevel: "M",
  });

  return (
    <main className="px-5 pt-12">
      <h1 className="text-[27px] font-black tracking-[-0.02em]">
        Çevreni davet et
      </h1>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        Vibe profilin, seni gerçekten tanıyan insanlarla anlam kazanır. Herkes
        yalnızca seni tanıdığı alanda değerlendirebilir.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Card className="!py-4 text-center">
          <div className="text-[24px] font-black grad-text tabular-nums leading-none">
            {profile.ratingCount}
          </div>
          <div className="text-[11.5px] text-muted font-semibold mt-1">
            değerlendirme
          </div>
        </Card>
        <Card className="!py-4 text-center">
          <div className="text-[24px] font-black grad-text tabular-nums leading-none">
            {joined}
          </div>
          <div className="text-[11.5px] text-muted font-semibold mt-1">
            davetinle katıldı
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle>Davet linkin</SectionTitle>
        <InviteShare url={url} qr={qr} name={user.name} />
      </div>

      <div className="mt-6 mb-2">
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
