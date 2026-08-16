import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { inviteByCode, inviteStatus } from "@/lib/invite";
import { acceptInviteAction } from "@/lib/actions/invite";
import { getVibeProfile } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { Wordmark } from "@/components/Logo";
import { TagPill } from "@/components/ui";

/**
 * The front door. Someone you know sent you here, so the page leads with
 * *them* — not with a product pitch and not with a signup wall.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const invite = await inviteByCode(code);
  if (!invite) notFound();

  // The invite cookie is set by the middleware on the way in.
  const me = await getCurrentUser();
  const inviter = invite.inviter;
  const profile = await getVibeProfile(inviter.id);
  const isSelf = me?.id === inviter.id;

  // A spent link still shows the person — it just cannot hand out permission.
  const status = inviteStatus(invite);
  const spent = status !== "ACTIVE";
  const spentReason =
    status === "EXPIRED"
      ? "Bu davet linkinin süresi dolmuş."
      : status === "REVOKED"
        ? "Bu davet linki iptal edilmiş."
        : "Bu davet linki kullanım hakkını doldurmuş.";

  return (
    <main className="min-h-dvh flex flex-col px-6 pt-12 pb-10 overflow-hidden">
      <Wordmark size={20} />

      <div className="mt-12 text-center pop relative">
        <div className="absolute left-1/2 top-8 -translate-x-1/2 w-48 h-48 rounded-full bg-coral/10 blur-3xl" aria-hidden />
        <Avatar
          name={inviter.name}
          url={inviter.avatarUrl}
          color={inviter.avatarColor}
          size={92}
          ring
        />
        <h1 className="vt-page-title relative mt-6 text-[30px] tracking-[-0.03em] leading-[1.08]">
          {inviter.name.split(" ")[0]} senden bir
          <br />
          <span className="grad-text">Vibe</span> bekliyor
        </h1>
        <p className="mt-3 text-[14.5px] text-muted leading-relaxed max-w-[20rem] mx-auto">
          Onu nereden tanıdığını seç, sadece o ilişkide gözlemlediğin şeyleri
          değerlendir. Cevabın <b className="text-ink">anonim</b> kalır.
        </p>
      </div>

      {profile.tags.length > 0 && (
        <div className="mt-7 reveal">
          <p className="text-[12px] font-bold text-muted text-center mb-2.5">
            İnsanlar {inviter.name.split(" ")[0]} için diyor ki
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {profile.tags.slice(0, 4).map((t) => (
              <TagPill key={t.key} tagKey={t.key} label={t.en} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-2.5 reveal">
        {[
          "Tanışıklığını seçmeden değerlendiremezsin",
          "Kimin ne yazdığı asla görünmez",
          "Bir kişiyi yalnızca bir kez değerlendirirsin",
        ].map((line) => (
          <div
            key={line}
            className="card !py-3.5 flex items-center gap-3 text-[13px] font-semibold"
          >
            <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full bg-tagbg border border-orange/20 text-[11px] font-black text-orange">✓</span>
            {line}
          </div>
        ))}
      </div>

      {spent && (
        <div className="mt-6 rounded-[20px] border border-orange/25 bg-tagbg px-4 py-3.5">
          <p className="text-[13px] font-bold text-orange">{spentReason}</p>
          <p className="text-[12.5px] text-muted mt-0.5 leading-relaxed">
            {inviter.name.split(" ")[0]} profilini yine görebilirsin; sadece
            davetiyle gelenlerden değerlendirme alıyorsa yeni bir link istemen
            gerekir.
          </p>
        </div>
      )}

      <div className="mt-auto pt-8 grid gap-3">
        {isSelf ? (
          <p className="text-center text-[13.5px] text-muted">
            Bu senin kendi davet linkin — paylaşmak için{" "}
            <Link href="/invite" className="font-bold text-orange">
              Davet ekranına
            </Link>{" "}
            git.
          </p>
        ) : me ? (
          <form action={acceptInviteAction}>
            <input type="hidden" name="username" value={inviter.username} />
            <button
              type="submit"
              className="h-13 w-full grid place-items-center rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)]"
            >
              {inviter.name.split(" ")[0]}’i değerlendir
            </button>
          </form>
        ) : (
          <>
            <Link
              href="/register"
              className="h-13 grid place-items-center rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)]"
            >
              Başla ve değerlendir
            </Link>
            <Link
              href="/login"
              className="text-center text-[14px] font-bold text-muted py-2"
            >
              Zaten hesabım var
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
