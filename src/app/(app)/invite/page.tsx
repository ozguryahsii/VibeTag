import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { getShareableInvite, inviteStats } from "@/lib/invite";
import { rotateInviteAction } from "@/lib/actions/invite";
import { baseUrl } from "@/lib/base-url";
import { getDict } from "@/lib/i18n/server";
import { getVibeProfile } from "@/lib/profile";
import { InviteShare } from "@/components/InviteShare";
import { Card, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function InvitePageApp() {
  const user = await requireUser();
  const d = await getDict();
  const invite = await getShareableInvite(user.id);
  const [{ granted, joined }, profile] = await Promise.all([
    inviteStats(user.id),
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
        {d.invite.kicker}
      </p>
      <h1 className="vt-page-title text-[28px] tracking-[-0.02em]">
        {d.invite.title}
      </h1>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        {d.invite.body}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[
          [profile.ratingCount, d.invite.statRatings],
          [granted, d.invite.statUsed],
          [joined, d.invite.statJoined],
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
        <SectionTitle>{d.invite.yourLink}</SectionTitle>
        <InviteShare url={url} qr={qr} name={user.name} dict={d} />
      </div>

      <div className="mt-5">
        <p className="text-[11.5px] text-muted px-1 leading-relaxed">
          {d.invite.linkUnique}
        </p>
        <form action={rotateInviteAction} className="mt-3">
          <button
            type="submit"
            className="w-full h-12 rounded-full bg-white border border-line text-[13.5px] font-bold text-muted active:scale-[0.98] transition-transform"
          >
            {d.invite.revoke}
          </button>
        </form>
      </div>

      <div className="mt-7 mb-2">
        <Card className="grid gap-3">
          <p className="text-[13px] font-extrabold">{d.invite.howTitle}</p>
          {d.invite.how.map((line, i) => (
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
