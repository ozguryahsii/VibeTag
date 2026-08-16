"use client";

import { useState } from "react";
import { fill, type Dictionary } from "@/lib/i18n";

export function InviteShare({
  url,
  qr,
  name,
  dict,
}: {
  url: string;
  qr: string;
  name: string;
  dict: Dictionary;
}) {
  const d = dict;
  const [status, setStatus] = useState<string | null>(null);

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2200);
  }

  const text = fill(d.invite.shareText, { name });

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      flash(d.common.copied);
    } catch {
      flash(d.common.copyFailed);
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Vibe Tag", text, url });
        return;
      } catch {
        /* dismissed */
      }
    }
    await copy();
  }

  const encoded = encodeURIComponent(`${text} ${url}`);

  return (
    <div>
      <div className="card p-6 text-center relative overflow-hidden">
        <span className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-orange/8" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt={d.invite.qrAlt}
          width={176}
          height={176}
          className="relative w-44 h-44 mx-auto rounded-[22px] border border-line shadow-[0_12px_30px_rgba(93,58,42,0.08)]"
          style={{ width: 176, height: 176, maxWidth: "100%" }}
        />
        <p className="text-[12px] text-muted mt-3">{d.invite.qrHint}</p>

        <button
          onClick={copy}
          className="mt-4 w-full rounded-[18px] border border-line bg-cream px-4 py-3 text-[12.5px] font-semibold text-left truncate active:scale-[0.99] transition-transform"
        >
          {url}
        </button>
      </div>

      <div className="mt-4 grid gap-2.5">
        <button
          onClick={share}
          className="h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform"
        >
          {d.invite.shareCta}
        </button>

        <div className="grid grid-cols-3 gap-2.5">
          <a
            href={`https://wa.me/?text=${encoded}`}
            target="_blank"
            rel="noreferrer"
            className="h-12 grid place-items-center rounded-[18px] bg-warmwhite border border-line text-[13px] font-bold"
          >
            WhatsApp
          </a>
          <a
            href={`https://x.com/intent/tweet?text=${encoded}`}
            target="_blank"
            rel="noreferrer"
            className="h-12 grid place-items-center rounded-[18px] bg-warmwhite border border-line text-[13px] font-bold"
          >
            X
          </a>
          <button
            onClick={copy}
            className="h-12 rounded-[18px] bg-warmwhite border border-line text-[13px] font-bold"
          >
            {d.common.copy}
          </button>
        </div>
      </div>

      {status && (
        <p className="mt-3 text-center text-[13px] font-bold text-orange">
          {status}
        </p>
      )}
    </div>
  );
}
