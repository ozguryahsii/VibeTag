import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";
import { canSendInConversation } from "@/lib/social";
import { Avatar } from "@/components/Avatar";
import { MessageComposer } from "@/components/MessageComposer";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const d = await getDict();
  const { id } = await params;

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, username: true, avatarUrl: true, avatarColor: true } },
      userB: { select: { id: true, name: true, username: true, avatarUrl: true, avatarColor: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!convo || (convo.userAId !== me.id && convo.userBId !== me.id)) notFound();

  const iAmA = convo.userAId === me.id;
  const other = iAmA ? convo.userB : convo.userA;
  const otherIsAnonymous = convo.anonymousSide === (iAmA ? "B" : "A");

  // Mark what they sent us as read now that it is on screen.
  await prisma.message.updateMany({
    where: { conversationId: convo.id, senderId: other.id, readAt: null },
    data: { readAt: new Date() },
  });

  const verdict = await canSendInConversation(me.id, convo);
  const blockedReason = verdict.ok
    ? null
    : verdict.reason === "BLOCKED"
      ? d.messages.blockedThread
      : verdict.reason === "FRIENDS_ONLY"
        ? d.messages.friendsOnly
        : verdict.reason === "PREMIUM_ONLY"
          ? d.messages.premiumOnly
          : d.messages.waitForReply;

  return (
    /*
     * A chat is one of the few screens that should not scroll as a page:
     * the header pins to the top, the composer to the bottom, and only the
     * transcript between them moves. `dvh` keeps that true when the mobile
     * browser chrome slides away.
     */
    <div className="fixed inset-x-0 top-0 bottom-0 max-w-[480px] mx-auto flex flex-col bg-cream">
      <header className="shrink-0 flex items-center gap-3.5 px-5 pt-10 pb-4 border-b border-line bg-cream">
        <Link
          href="/messages"
          aria-label={d.common.back}
          className="w-9 h-9 grid place-items-center rounded-full bg-warmwhite border border-line text-[15px] text-muted"
        >
          ←
        </Link>

        {/*
         * Tapping the avatar or the name opens their profile — the obvious
         * gesture in any chat app. It is a plain <span> only when the other
         * side is anonymous, because there the link would be the leak.
         */}
        {otherIsAnonymous ? (
          <>
            <span className="w-11 h-11 shrink-0 grid place-items-center rounded-full bg-line text-[16px]">
              🕶️
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold truncate">
                {d.messages.anonymousPartner}
              </p>
              <p className="text-[11.5px] text-muted truncate">
                {d.messages.aboutRating}
              </p>
            </div>
          </>
        ) : (
          <Link
            href={`/u/${other.username}`}
            className="flex min-w-0 items-center gap-3.5"
          >
            <Avatar
              name={other.name}
              url={other.avatarUrl}
              color={other.avatarColor}
              size={44}
            />
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold truncate">
                {other.name}
              </span>
              <span className="block text-[11.5px] text-muted truncate">
                {convo.kind === "RATING"
                  ? d.messages.aboutRating
                  : `@${other.username}`}
              </span>
            </span>
          </Link>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {otherIsAnonymous && (
          <p className="mb-4 rounded-[18px] border border-line bg-warmwhite px-4 py-3 text-[12px] text-muted leading-relaxed">
            {d.messages.anonymousNote}
          </p>
        )}

        <div className="grid gap-2.5">
          {convo.messages.map((m) => {
            const mine = m.senderId === me.id;
            return (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-[20px] px-4 py-3 text-[14px] leading-relaxed ${
                  mine
                    ? "ml-auto text-white grad-score"
                    : "bg-warmwhite border border-line"
                }`}
              >
                {m.body}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="shrink-0 px-5 pt-3 border-t border-line bg-cream"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      >
        {blockedReason ? (
          <p className="rounded-[18px] border border-orange/25 bg-tagbg px-4 py-3.5 text-[12.5px] text-orange leading-relaxed">
            {blockedReason}
          </p>
        ) : (
          <MessageComposer
            conversationId={convo.id}
            placeholder={d.messages.placeholder}
            sendLabel={d.messages.send}
            sendingLabel={d.common.sending}
          />
        )}
      </div>
    </div>
  );
}
