import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { inviteByCode, inviteStatus } from "@/lib/invite";
import { acceptInviteAction } from "@/lib/actions/invite";
import { getVibeProfile } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { Wordmark } from "@/components/Logo";
import { TagPill } from "@/components/ui";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { getLocale } from "@/lib/i18n/server";
import { tagLabel } from "@/lib/labels";

/**
 * The front door. Someone you know sent you here, so the page leads with
 * *them* — not with a product pitch and not with a signup wall.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const d = await getDict();
  const locale = await getLocale();
  const { code } = await params;
  const invite = await inviteByCode(code);
  if (!invite) notFound();

  // The invite cookie is set by the middleware on the way in.
  const me = await getCurrentUser();
  const inviter = invite.inviter;
  const profile = await getVibeProfile(inviter.id);
  const isSelf = me?.id === inviter.id;
  const firstName = inviter.name.split(" ")[0];

  // A spent link still shows the person — it just cannot hand out permission.
  const status = inviteStatus(invite);
  const spent = status !== "ACTIVE";
  const spentReason =
    status === "EXPIRED"
      ? d.inviteLanding.expired
      : status === "REVOKED"
        ? d.inviteLanding.revoked
        : d.inviteLanding.exhausted;

  return (
    <main className="min-h-dvh flex flex-col px-6 pt-12 pb-10 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <Wordmark size={20} />
        <LangToggle />
      </div>

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
          {fill(d.inviteLanding.waiting, { name: firstName })}
          <br />
          <span className="grad-text">{d.inviteLanding.waitingVibe}</span>
        </h1>
        <p
          className="mt-3 text-[14.5px] text-muted leading-relaxed max-w-[20rem] mx-auto [&_b]:text-ink"
          dangerouslySetInnerHTML={{ __html: d.inviteLanding.body }}
        />
      </div>

      {profile.tags.length > 0 && (
        <div className="mt-7 reveal">
          <p className="text-[12px] font-bold text-muted text-center mb-2.5">
            {fill(d.inviteLanding.peopleSay, { name: firstName })}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {profile.tags.slice(0, 4).map((t) => (
              <TagPill key={t.key} tagKey={t.key} label={tagLabel(t.key, locale)} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-2.5 reveal">
        {d.inviteLanding.points.map((line) => (
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
            {fill(d.inviteLanding.spentBody, { name: firstName })}
          </p>
        </div>
      )}

      <div className="mt-auto pt-8 grid gap-3">
        {isSelf ? (
          <p className="text-center text-[13.5px] text-muted">
            {d.inviteLanding.ownLink}{" "}
            <Link href="/invite" className="font-bold text-orange">
              {d.inviteLanding.ownLinkCta}
            </Link>{" "}
            {d.inviteLanding.ownLinkEnd}
          </p>
        ) : me ? (
          <form action={acceptInviteAction}>
            <input type="hidden" name="username" value={inviter.username} />
            <button
              type="submit"
              className="h-13 w-full grid place-items-center rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)]"
            >
              {fill(d.inviteLanding.rateCta, { name: firstName })}
            </button>
          </form>
        ) : (
          <>
            <Link
              href="/register"
              className="h-13 grid place-items-center rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)]"
            >
              {d.inviteLanding.startCta}
            </Link>
            <Link
              href="/login"
              className="text-center text-[14px] font-bold text-muted py-2"
            >
              {d.inviteLanding.haveAccount}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
