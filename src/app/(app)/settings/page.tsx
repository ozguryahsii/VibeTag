import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/lib/actions/auth";
import { setCommentPolicyAction, toggleBlockAction } from "@/lib/actions/safety";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PhotoVault } from "@/components/PhotoVault";
import { mainPhotoId, photoLimit } from "@/lib/photos";
import { canStartTrial, trialStateFor } from "@/lib/trial";
import { DeleteAccount } from "@/components/DeleteAccount";
import { PushToggle } from "@/components/PushToggle";
import { NativePushToggle } from "@/components/NativePushToggle";
import { RedeemCode } from "@/components/RedeemCode";
import { Avatar } from "@/components/Avatar";
import { IconGlyph } from "@/components/Icon";
import { ICONS } from "@/lib/icons";
import { Card, SectionTitle } from "@/components/ui";
import { getDict } from "@/lib/i18n/server";
import { isNativeShell } from "@/lib/native-shell";
import { fill } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";

const PLAN_KEYS = [
  { key: "FREE", dict: "free" },
  { key: "SILVER", dict: "silver" },
  { key: "GOLD", dict: "gold" },
] as const;

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const d = await getDict();
  // Inside the store apps the membership section may not show prices beside
  // no purchase button (App Store 3.1.1), and an arbitrary redeem code that
  // unlocks premium reads as sidestepping in-app purchase. Both hide until
  // IAP lands; the web keeps them.
  const inShell = await isNativeShell();
  const pushKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
  const vault = await prisma.profilePhoto.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
  });

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {d.settings.kicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">
            {d.settings.title}
          </h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1">
        @{user.username} · {user.email}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <Link
          href={`/u/${user.username}`}
          className="card !py-4 text-center text-[12.5px] font-bold"
        >
          {d.settings.myProfile}
        </Link>
        <Link
          href="/card"
          className="card !py-4 text-center text-[12.5px] font-bold"
        >
          {d.settings.vibeCard}
        </Link>
        <Link
          href="/invite"
          className="card !py-4 text-center text-[12.5px] font-bold"
        >
          {d.settings.invite}
        </Link>
      </div>

      <div className="mt-6">
        <SectionTitle>{d.settings.editProfile}</SectionTitle>
        <PhotoVault
          photos={vault.map((p) => ({
            id: p.id,
            url: p.url,
            isMain: p.id === mainPhotoId(vault, user.avatarUrl),
          }))}
          limit={photoLimit(user.plan)}
        />
        <div className="mt-2.5">
          <ProfileEditor
            name={user.name}
            bio={user.bio ?? ""}
            avatarColor={user.avatarColor}
          />
        </div>
      </div>

      <div className="mt-7">
        <SectionTitle>{d.settings.membership}</SectionTitle>
        <div className="grid gap-2.5">
          {PLAN_KEYS.map((p) => {
            const plan = d.settings.plans[p.dict];
            const active = user.plan === p.key;
            // One trial per account, not one per plan: once it is spent the
            // badge has to stop appearing on *every* card, or the screen is
            // promising something the rule will refuse.
            const trial = trialStateFor(user, p.key);
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
                    <span className="text-[16px] font-black">{plan.name}</span>
                    <span className="text-[12px] font-bold text-coral ml-2">
                      {plan.tagline}
                    </span>
                  </div>
                  {!inShell && (
                    <div className="text-right">
                      <span className="block text-[14px] font-extrabold">
                        {plan.price}
                      </span>
                      {trial.kind === "OFFER" && plan.trial && (
                        <span className="block text-[10.5px] font-bold text-orange">
                          {plan.trial}
                        </span>
                      )}
                      {trial.kind === "SPENT" && (
                        <span className="block text-[10.5px] font-semibold text-muted">
                          {d.settings.trialSpentShort}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <ul className="mt-3 grid gap-1.5">
                  {plan.perks.map((perk) => (
                    <li
                      key={perk}
                      className="text-[12.5px] text-muted flex gap-2"
                    >
                      <span className="text-orange">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>

                {active && (
                  <p className="mt-4 text-[12.5px] font-bold text-orange">
                    {d.settings.activePlan}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11.5px] text-muted mt-3 px-1 leading-relaxed">
          {inShell ? d.settings.planNoteShell : d.settings.planNote}
        </p>
        {!inShell && (
          <p className="text-[11.5px] text-muted mt-1.5 px-1 leading-relaxed">
            {canStartTrial(user)
              ? d.settings.trialNote
              : fill(d.settings.trialSpent, {
                  plan:
                    d.settings.plans[
                      (user.trialPlan ?? "").toLowerCase() as "silver" | "gold"
                    ]?.name ?? user.trialPlan ?? "",
                })}
          </p>
        )}
        {!inShell && (
          <div className="mt-3">
            <RedeemCode />
          </div>
        )}
      </div>

      {/*
        Two transports, one switch. Inside the app shell Web Push cannot work
        at all (WKWebView has no Push API), so the native toggle is shown
        there regardless of whether VAPID keys exist; on the web the browser
        toggle appears only when they do, since without them it could not do
        anything.
      */}
      {(inShell || pushKey) && (
        <div className="mt-7">
          <SectionTitle>{d.nav.notifications}</SectionTitle>
          {inShell ? <NativePushToggle /> : <PushToggle publicKey={pushKey!} />}
        </div>
      )}

      <div className="mt-7">
        <SectionTitle>{d.settings.privacy}</SectionTitle>

        <Card className="grid gap-3">
          <div>
            <p className="text-[13.5px] font-extrabold">
              {d.settings.whoCanComment}
            </p>
            <p className="text-[12px] text-muted leading-relaxed mt-0.5">
              {d.settings.whoCanCommentBody}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                key: "EVERYONE",
                label: d.settings.everyone,
                hint: d.settings.everyoneHint,
              },
              {
                key: "CIRCLE",
                label: d.settings.circleOnly,
                hint: d.settings.circleOnlyHint,
              },
            ].map((opt) => {
              const active = user.commentPolicy === opt.key;
              return (
                <form key={opt.key} action={setCommentPolicyAction}>
                  <input type="hidden" name="commentPolicy" value={opt.key} />
                  <button
                    type="submit"
                    className={`w-full h-full rounded-[20px] p-3 text-left ${
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
          {d.settings.privacyPoints.map((point) => (
            <div key={point.title}>
              <span className="block text-[13px] font-bold">{point.title}</span>
              <span className="block text-[12px] text-muted leading-relaxed mt-0.5">
                {point.body}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <div className="mt-7">
        <SectionTitle>{d.settings.blocked}</SectionTitle>
        {blocks.length === 0 ? (
          <Card className="!py-5 text-center">
            <p className="text-[13px] text-muted">{d.settings.blockedEmpty}</p>
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
                    {d.common.remove}
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </div>

      {!user.emailVerifiedAt && (
        <Link href="/verify" className="block mt-4">
          <Card className="flex items-center gap-3.5">
            <span className="w-10 h-10 shrink-0 grid place-items-center rounded-full"
              style={{ background: "linear-gradient(135deg,#5FC08A,#2F8C5E)" }}>
              <IconGlyph def={ICONS.envelope} size={18} color="#fff" />
            </span>
            <span className="flex-1">
              <span className="block text-[13.5px] font-extrabold">
                {d.settings.verifyTitle}
              </span>
              <span className="block text-[12px] text-muted leading-relaxed">
                {d.settings.verifyBody}
              </span>
            </span>
          </Card>
        </Link>
      )}

      {user.isAdmin && (
        <div className="mt-7">
          <SectionTitle>{d.admin.kicker}</SectionTitle>
          <div className="grid gap-2.5">
            {[
              { href: "/admin", label: d.admin.open },
              { href: "/moderation", label: d.moderation.title },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="card flex items-center justify-between !py-4"
              >
                <span className="text-[13.5px] font-bold">{item.label}</span>
                <span className="text-orange font-bold text-[18px]">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7">
        <SectionTitle>{d.settings.account}</SectionTitle>
        <div className="grid gap-2.5">
          <DeleteAccount username={user.username} plan={user.plan} />
        </div>
      </div>

      <div className="mt-7">
        <SectionTitle>{d.legal.title}</SectionTitle>
        <Card className="grid gap-0.5 !py-2">
          {(["privacy", "kvkk", "terms"] as const).map((slug) => (
            <Link
              key={slug}
              href={`/legal/${slug}`}
              className="flex items-center justify-between py-2.5"
            >
              <span className="text-[13px] font-semibold">{d.legal[slug]}</span>
              <span className="text-orange font-bold text-[16px]">→</span>
            </Link>
          ))}
        </Card>
      </div>

      <form action={logoutAction} className="mt-6 mb-2">
        <button
          type="submit"
          className="w-full h-12 rounded-full bg-white border border-line text-[14px] font-bold text-muted active:scale-[0.98] transition-transform"
        >
          {d.common.signOut}
        </button>
      </form>
    </main>
  );
}
