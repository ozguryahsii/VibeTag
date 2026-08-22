"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  archiveThreadAction,
  deleteThreadAction,
} from "@/lib/actions/social";
import { fill, useD } from "@/components/LocaleProvider";

const REVEAL = 96; // how far the row slides to park a button open
const TRIGGER = 48; // drag past this and the row parks instead of springing back

/**
 * A thread row you can swipe.
 *
 * Left uncovers Delete, right uncovers Archive — the two actions live behind
 * the row rather than on it, so the list stays a list. Delete asks first;
 * archive is reversible, so it does not.
 *
 * Pointer events rather than touch events: the same code then works with a
 * mouse on the desktop layout, and the buttons underneath stay reachable for
 * anyone who cannot drag at all.
 */
export function SwipeThread({
  conversationId,
  name,
  archived,
  children,
}: {
  conversationId: string;
  name: string;
  archived: boolean;
  children: ReactNode;
}) {
  const d = useD();
  const [dx, setDx] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const start = useRef<number | null>(null);
  const dragging = useRef(false);

  function onDown(e: React.PointerEvent) {
    start.current = e.clientX;
    dragging.current = false;
  }
  function onMove(e: React.PointerEvent) {
    if (start.current === null) return;
    const delta = e.clientX - start.current;
    if (Math.abs(delta) > 6) dragging.current = true;
    setDx(Math.max(-REVEAL, Math.min(REVEAL, delta)));
  }
  function onUp() {
    if (start.current === null) return;
    start.current = null;
    setDx((v) => (v <= -TRIGGER ? -REVEAL : v >= TRIGGER ? REVEAL : 0));
  }

  const dialog = confirm ? (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6 vt-fade"
      role="dialog"
      aria-modal="true"
      onClick={() => setConfirm(false)}
    >
      <div
        className="w-full max-w-[340px] rounded-[26px] bg-warmwhite border border-line p-6 shadow-[0_24px_70px_rgba(76,44,31,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[15px] font-extrabold">{d.messages.deleteTitle}</p>
        <p className="text-[13px] text-muted leading-relaxed mt-1.5">
          {fill(d.messages.deleteBody, { name })}
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => setConfirm(false)}
            className="flex-1 h-11 rounded-full bg-white border border-line text-[13px] font-bold text-muted active:scale-[0.98] transition-transform"
          >
            {d.common.no}
          </button>
          <form action={deleteThreadAction} className="flex-1">
            <input type="hidden" name="conversationId" value={conversationId} />
            <button className="w-full h-11 rounded-full text-[13px] font-bold text-white bg-[#F05262] active:scale-[0.98] transition-transform">
              {d.messages.deleteConfirm}
            </button>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative overflow-hidden rounded-[26px]">
      {/* Behind the row: archive on the left edge, delete on the right. */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <form action={archiveThreadAction}>
          <input type="hidden" name="conversationId" value={conversationId} />
          <input type="hidden" name="archived" value={archived ? "off" : "on"} />
          <button
            className="h-full w-24 text-[12.5px] font-bold text-white bg-orange/90 px-3"
            style={{ minHeight: 72 }}
          >
            {archived ? d.messages.unarchive : d.messages.archive}
          </button>
        </form>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="h-full w-24 text-[12.5px] font-bold text-white bg-[#F05262] px-3"
          style={{ minHeight: 72 }}
        >
          {d.common.delete}
        </button>
      </div>

      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        /*
         * The row contains a link, and dragging a link is a native browser
         * gesture: Chromium starts its own drag and cancels the pointer
         * stream, so the swipe simply never happened. Refusing dragstart
         * hands the gesture back to us.
         */
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        /*
         * A drag must not open the thread — but the click that *ends* the
         * drag must not close the drawer either, or the button it just
         * revealed is unreachable. So: swallow the drag's own click and
         * leave the drawer open; a later, real tap closes it.
         */
        onClickCapture={(e) => {
          if (dragging.current) {
            dragging.current = false;
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (dx !== 0) {
            e.preventDefault();
            e.stopPropagation();
            setDx(0);
          }
        }}
        className="relative touch-pan-y select-none"
        style={{
          transform: `translateX(${dx}px)`,
          transition: start.current === null ? "transform .2s ease-out" : "none",
        }}
      >
        {children}
      </div>

      {dialog && createPortal(dialog, document.body)}
    </div>
  );
}
