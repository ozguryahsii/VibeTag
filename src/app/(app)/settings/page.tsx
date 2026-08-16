import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction, setPlanAction } from "@/lib/actions/auth";
import { setRatingPolicyAction, toggleBlockAction } from "@/lib/actions/safety";
import { ProfileEditor } from "@/components/ProfileEditor";
import { DeleteAccount } from "@/components/DeleteAccount";
import { PushToggle } from "@/components/PushToggle";
import { Avatar } from "@/components/Avatar";
import { Card, SectionTitle } from "@/components/ui";
import { getDict } from "@/lib/i18n/server";
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
  const pushKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;

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
        <ProfileEditor
          name={user.name}
          bio={user.bio ?? ""}
          avatarUrl={user.avatarUrl}
          avatarColor={user.avatarColor}
        />
      </div>

      <div className="mt-7">
        <SectionTitle>{d.settings.membership}</SectionTitle>
        <div className="grid gap-2.5">
          {PLAN_KEYS.map((p) => {
            const plan = d.settings.plans[p.dict];
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
                    <span className="text-[16px] font-black">{plan.name}</span>
                    <span className="text-[12px] font-bold text-coral ml-2">
                      {plan.tagline}
                    </span>
                  </div>
                  <span className="text-[14px] font-extrabold">{plan.price}</span>
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

                {active ? (
                  <p className="mt-4 text-[12.5px] font-bold text-orange">
                    {d.settings.activePlan}
                  </p>
                ) : (
                  <form action={setPlanAction} className="mt-4">
                    <input type="hidden" name="plan" value={p.key} />
                    <button
                      type="submit"
                      className="h-11 w-full rounded-full font-bold text-[14px] text-white active:scale-[0.98] transition-transform grad-score"
                    >
                      {p.key === "FREE"
                        ? d.settings.backToFree
                        : fill(d.settings.switchTo, { plan: plan.name })}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11.5px] text-muted mt-3 px-1 leading-relaxed">
          {d.settings.planNote}
        </p>
      </div>

      {/* Only offered when push is actually configured for this deployment. */}
      {pushKey && (
        <div className="mt-7">
          <SectionTitle>{d.nav.notifications}</SectionTitle>
          <PushToggle publicKey={pushKey} />
        </div>
      )}

      <div className="mt-7">
        <SectionTitle>{d.settings.privacy}</SectionTitle>

        <Card className="grid gap-3">
          <div>
            <p className="text-[13.5px] font-extrabold">
              {d.settings.whoCanRate}
            </p>
            <p className="text-[12px] text-muted leading-relaxed mt-0.5">
              {d.settings.whoCanRateBody}
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
                key: "INVITED",
                label: d.settings.invitedOnly,
                hint: d.settings.invitedOnlyHint,
              },
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

      {user.isAdmin && (
        <div className="mt-7">
          <SectionTitle>{d.nav.moderation}</SectionTitle>
          <Link
            href="/moderation"
            className="card flex items-center justify-between !py-4"
          >
            <span className="text-[13.5px] font-bold">
              {d.moderation.title}
            </span>
            <span className="text-orange font-bold text-[18px]">→</span>
          </Link>
        </div>
      )}

      <div className="mt-7">
        <SectionTitle>{d.settings.account}</SectionTitle>
        <div className="grid gap-2.5">
          <DeleteAccount username={user.username} />
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
