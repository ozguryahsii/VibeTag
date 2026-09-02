"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  submitRatingAction,
  type RatingState,
} from "@/lib/actions/rating";
import {
  MAX_VIBE_TAGS_PER_RATING,
  RELATIONSHIPS,
  allowedTraits,
  traitQuestion,
  allowedVibeTags,
  relationshipsByGroup,
  type ContextGroup,
  type RelationshipKey,
} from "@/lib/taxonomy";
import { Avatar } from "@/components/ui";
import { IconGlyph, TagIcon, TraitIcon } from "@/components/Icon";
import { groupIconFor, relationshipIconFor } from "@/lib/icons";
import { fill, useD, useLocale } from "@/components/LocaleProvider";
import { NativePushPrompt } from "@/components/NativePushPrompt";
import {
  groupBlurb,
  groupLabel,
  relationshipLabel,
  tagLabel,
  traitHint,
  traitLabel,
} from "@/lib/labels";

const DEFAULT_SCORE = 4;
const GROUP_ORDER: ContextGroup[] = [
  "PROFESSIONAL",
  "SOCIAL",
  "COMMERCE",
  "OTHER",
];

export type RateTarget = {
  name: string;
  username: string;
  avatarUrl: string | null;
  avatarColor: string;
};

export type ExistingSummary = {
  relationship: RelationshipKey;
  traits: Record<string, number>;
  tags: string[];
  comment: string | null;
  cooldownDaysLeft: number;
  updateCount: number;
};

export function RateFlow({
  target,
  existing,
}: {
  target: RateTarget;
  existing: ExistingSummary | null;
}) {
  const d = useD();
  const locale = useLocale();
  const firstName = target.name.split(" ")[0];
  const [state, formAction, pending] = useActionState<RatingState, FormData>(
    submitRatingAction,
    {},
  );

  const [step, setStep] = useState(0);
  const [relationship, setRelationship] = useState<RelationshipKey | null>(
    existing?.relationship ?? null,
  );
  const [scores, setScores] = useState<Record<string, number>>(
    existing?.traits ?? {},
  );
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [comment, setComment] = useState(existing?.comment ?? "");

  const traits = useMemo(
    () => (relationship ? allowedTraits(relationship) : []),
    [relationship],
  );
  const tagOptions = useMemo(
    () => (relationship ? allowedVibeTags(relationship) : []),
    [relationship],
  );

  const locked = !!existing && existing.cooldownDaysLeft > 0;

  if (state.ok) {
    return (
      <Success target={target} isUpdate={!!state.updated} />
    );
  }

  function chooseRelationship(key: RelationshipKey) {
    setRelationship(key);
    // Drop any score/tag the new context does not permit, and open the
    // remaining criteria at 4 ("very good") so the rater adjusts instead of
    // dragging six sliders from zero on a phone.
    const allowedTraitKeys = RELATIONSHIPS[key].traits as string[];
    setScores((prev) =>
      Object.fromEntries(
        allowedTraitKeys.map((k) => [k, prev[k] ?? DEFAULT_SCORE]),
      ),
    );
    const allowedTagKeys = new Set(allowedVibeTags(key).map((t) => t.key as string));
    setTags((prev) => prev.filter((t) => allowedTagKeys.has(t)));
    setStep(1);
  }

  function toggleTag(key: string) {
    setTags((prev) =>
      prev.includes(key)
        ? prev.filter((t) => t !== key)
        : prev.length >= MAX_VIBE_TAGS_PER_RATING
          ? prev
          : [...prev, key],
    );
  }

  const allScored = traits.every((t) => scores[t.key] !== undefined);

  return (
    <main className="px-5 pt-10 pb-6">
      {/* target header */}
      <header className="flex items-center gap-3.5 reveal">
        <Avatar
          name={target.name}
          url={target.avatarUrl}
          color={target.avatarColor}
          size={54}
          ring
        />
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-muted">
            {d.rateFlow.youAreRating}
          </p>
          <h1 className="vt-page-title text-[22px] tracking-[-0.02em] truncate">
            {target.name}
          </h1>
        </div>
        <Link
          href={`/u/${target.username}`}
          className="ml-auto text-[12px] font-bold text-muted"
        >
          {d.rateFlow.quit}
        </Link>
      </header>

      {/* progress */}
      <div
        className="mt-6 flex gap-1.5"
        aria-label={fill(d.rateFlow.step, { n: step + 1 })}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: i <= step ? "#FF8A3D" : "#F0E5DD" }}
          />
        ))}
      </div>

      {locked && (
        <div className="mt-5 rounded-[20px] border border-orange/25 bg-tagbg px-4 py-3.5">
          <p className="text-[13px] font-bold text-orange">
            {d.rateFlow.alreadyRated}
          </p>
          <p
            className="text-[12.5px] text-muted mt-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: fill(d.rateFlow.alreadyRatedBody, {
                n: existing!.cooldownDaysLeft,
              }),
            }}
          />
        </div>
      )}

      {existing && !locked && (
        <div className="mt-5 rounded-[20px] border border-line bg-warmwhite px-4 py-3.5 shadow-[0_10px_30px_rgba(93,58,42,0.04)]">
          <p className="text-[13px] font-bold">{d.rateFlow.updating}</p>
          <p className="text-[12.5px] text-muted mt-0.5">
            {d.rateFlow.updatingBody}
          </p>
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="username" value={target.username} />
        {relationship && (
          <input type="hidden" name="relationship" value={relationship} />
        )}
        {traits.map((t) =>
          scores[t.key] !== undefined ? (
            <input
              key={t.key}
              type="hidden"
              name={`trait:${t.key}`}
              value={scores[t.key]}
            />
          ) : null,
        )}
        {tags.map((t) => (
          <input key={t} type="hidden" name="tags" value={t} />
        ))}
        <input type="hidden" name="comment" value={comment} />

        {/* ---------------------------------------------- step 0 */}
        {step === 0 && (
          <section className="mt-6 reveal">
            <p className="text-[10px] font-extrabold tracking-[0.24em] text-coral mb-2">
              {d.rateFlow.contextKicker}
            </p>
            <h2 className="vt-page-title text-[28px] leading-[1.08] tracking-[-0.02em]">
              {fill(d.rateFlow.contextTitle, { name: firstName })}
            </h2>
            <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
              {d.rateFlow.contextBody}
            </p>

            <div className="mt-5 grid gap-5">
              {GROUP_ORDER.map((g) => (
                <div key={g}>
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <IconGlyph def={groupIconFor(g)} size={16} color="#FF8A3D" />
                    <span className="text-[13px] font-extrabold">
                      {groupLabel(g, d)}
                    </span>
                    <span className="text-[11.5px] text-muted">
                      · {groupBlurb(g, d)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {relationshipsByGroup(g).map((r) => {
                      const active = relationship === r.key;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => chooseRelationship(r.key)}
                          className={`text-left rounded-[22px] p-4 transition-transform active:scale-[0.97] ${
                            active
                              ? "grad-ring"
                              : "bg-warmwhite border border-line"
                          }`}
                          style={{
                            boxShadow: active
                              ? "0 10px 26px rgba(255,138,61,0.18)"
                              : undefined,
                          }}
                        >
                          <IconGlyph
                            def={relationshipIconFor(r.key)}
                            size={20}
                            color={active ? "#FF5C77" : "#8C8177"}
                          />
                          <div className="text-[13px] font-bold leading-tight mt-1.5">
                            {relationshipLabel(r.key, d)}
                          </div>
                          <div className="text-[11px] text-muted mt-0.5">
                            {fill(d.rateFlow.criteriaCount, {
                              n: r.traits.length,
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------------------------------------- step 1 */}
        {step === 1 && relationship && (
          <section className="mt-6 reveal">
            <p className="text-[10px] font-extrabold tracking-[0.24em] text-coral mb-2">
              {d.rateFlow.scoreKicker}
            </p>
            <h2 className="vt-page-title text-[28px] leading-[1.08] tracking-[-0.02em]">
              {d.rateFlow.scoreTitle}
            </h2>
            <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
              <b className="text-ink">
                {relationshipLabel(relationship, d)}
              </b>{" "}
              {d.rateFlow.scoreBody}
            </p>

            <div className="mt-5 grid gap-3">
              {traits.map((t) => {
                const v = scores[t.key];
                return (
                  <div key={t.key} className="card p-4.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[14px] font-extrabold inline-flex items-center gap-2">
                        <TraitIcon traitKey={t.key} color="#FF8A3D" size={17} />
                        {traitLabel(t.key, locale)}
                      </span>
                      <span className="text-[12px] font-bold text-orange">
                        {v ? d.rateFlow.scoreWords[v] : "—"}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-muted mt-0.5 mb-3">
                      {traitQuestion(relationship, t.key, locale) ??
                        traitHint(t.key, d)}
                    </p>
                    <input
                      type="range"
                      className="vt-range"
                      min={1}
                      max={5}
                      step={1}
                      value={v ?? DEFAULT_SCORE}
                      onChange={(e) =>
                        setScores((s) => ({
                          ...s,
                          [t.key]: Number(e.target.value),
                        }))
                      }
                    />
                    <div className="flex justify-between mt-1.5 px-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className="text-[10px] font-bold tabular-nums"
                          style={{ color: v === n ? "#FF5C77" : "#C9BEB6" }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-tagbg border border-orange/15 px-4 py-3">
              <p className="text-[12px] text-orange font-semibold leading-relaxed">
                {d.rateFlow.scoreGuard}
              </p>
            </div>
          </section>
        )}

        {/* ---------------------------------------------- step 2 */}
        {step === 2 && relationship && (
          <section className="mt-6 reveal">
            <p className="text-[10px] font-extrabold tracking-[0.24em] text-coral mb-2">
              {d.rateFlow.tagsKicker}
            </p>
            <h2 className="vt-page-title text-[28px] leading-[1.08] tracking-[-0.02em]">
              {d.rateFlow.tagsTitle}
            </h2>
            <p
              className="text-[13px] text-muted mt-1.5 [&_b]:text-ink"
              dangerouslySetInnerHTML={{
                __html: fill(d.rateFlow.tagsBody, {
                  max: MAX_VIBE_TAGS_PER_RATING,
                  n: tags.length,
                }),
              }}
            />

            <div className="mt-5 flex flex-wrap gap-2">
              {tagOptions.map((t) => {
                const active = tags.includes(t.key);
                const full =
                  !active && tags.length >= MAX_VIBE_TAGS_PER_RATING;
                return (
                  <button
                    key={t.key}
                    type="button"
                    disabled={full}
                    onClick={() => toggleTag(t.key)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold transition-transform active:scale-95 disabled:opacity-35"
                    style={
                      active
                        ? {
                            background:
                              "linear-gradient(135deg,#FF8A3D,#FF5C77)",
                            color: "#fff",
                            border: "1px solid transparent",
                            boxShadow: "0 8px 20px rgba(255,92,119,0.28)",
                          }
                        : {
                            background: "#FFF0E8",
                            color: "#FF8A3D",
                            border: "1px solid #FFE3D2",
                          }
                    }
                  >
                    <TagIcon tagKey={t.key} size={15} />
                    {tagLabel(t.key, locale)}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------------------------------------------- step 3 */}
        {step === 3 && relationship && (
          <section className="mt-6 reveal">
            <p className="text-[10px] font-extrabold tracking-[0.24em] text-coral mb-2">
              {d.rateFlow.noteKicker}
            </p>
            <h2 className="vt-page-title text-[28px] leading-[1.08] tracking-[-0.02em]">
              {d.rateFlow.noteTitle}
            </h2>
            <p className="text-[13px] text-muted mt-1.5">
              {d.rateFlow.noteBody}
            </p>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 280))}
              rows={4}
              placeholder={d.rateFlow.notePlaceholder}
              className="mt-4 w-full rounded-[22px] border border-line bg-warmwhite p-4 text-[14px] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 transition resize-none shadow-[0_10px_30px_rgba(93,58,42,0.035)]"
            />
            <div className="text-right text-[11px] text-muted mt-1">
              {comment.length}/280
            </div>

            <div className="mt-4 rounded-2xl bg-warmwhite border border-line px-4 py-3.5">
              <p
                className="text-[12.5px] text-muted leading-relaxed [&_b]:text-ink"
                dangerouslySetInnerHTML={{
                  __html: fill(d.rateFlow.privacyNote, { name: firstName }),
                }}
              />
            </div>
          </section>
        )}

        {state.error && (
          <p className="mt-5 text-[13px] font-semibold text-coral bg-coral/8 border border-coral/20 rounded-2xl px-4 py-3">
            {state.error}
          </p>
        )}

        {/* nav */}
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="h-13 px-6 rounded-full bg-white border border-line font-bold text-[15px] active:scale-[0.98] transition-transform"
            >
              {d.common.back}
            </button>
          )}

          {step < 3 ? (
            /*
             * The key matters. Without it React reconciles this button and the
             * submit button below as the same DOM node and merely patches
             * `type` — so advancing from step 2 flipped the live node to
             * type="submit" mid-click, and the browser's default action then
             * submitted the form, skipping the comment step entirely.
             */
            <button
              key="advance"
              type="button"
              disabled={
                (step === 0 && !relationship) ||
                (step === 1 && !allScored) ||
                (step === 2 && tags.length === 0)
              }
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform disabled:opacity-40 disabled:shadow-none"
            >
              {step === 1 && !allScored
                ? d.rateFlow.scoreAll
                : step === 2 && tags.length === 0
                  ? d.rateFlow.pickTag
                  : d.common.continue}
            </button>
          ) : (
            <button
              key="submit"
              type="submit"
              disabled={pending || locked}
              className="flex-1 h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              {pending
                ? d.rateFlow.submitting
                : locked
                  ? d.rateFlow.lockedSubmit
                  : existing
                    ? d.rateFlow.submitUpdate
                    : d.rateFlow.submit}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

function Success({
  target,
  isUpdate,
}: {
  target: RateTarget;
  isUpdate: boolean;
}) {
  const d = useD();
  const firstName = target.name.split(" ")[0];

  return (
    <main className="min-h-dvh px-6 flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="pop w-20 h-20 rounded-full grid place-items-center grad-score text-white text-[28px] font-display shadow-[0_18px_44px_rgba(255,92,119,0.28)]">✓</div>
      <p className="mt-6 text-[10px] font-extrabold tracking-[0.26em] text-coral">
        {d.rateFlow.successKicker}
      </p>
      <h1 className="vt-page-title mt-2 text-[30px] tracking-[-0.02em] leading-tight">
        {isUpdate ? d.rateFlow.successUpdate : d.rateFlow.successNew}
      </h1>
      <p
        className="mt-2.5 text-[14px] text-muted leading-relaxed max-w-[18rem] [&_b]:text-ink"
        dangerouslySetInnerHTML={{
          __html: fill(d.rateFlow.successBody, { name: firstName }),
        }}
      />

      {/*
        The second moment to ask about notifications: somebody who has just
        rated a person is about to start expecting something back. Silent on
        the web and for anyone who has already answered.
      */}
      <div className="mt-7 w-full max-w-[20rem] text-left">
        <NativePushPrompt />
      </div>

      <div className="mt-6 grid gap-3 w-full max-w-[20rem]">
        <Link
          href={`/u/${target.username}`}
          className="h-13 grid place-items-center rounded-full grad-score text-white font-bold text-[15px]"
        >
          {fill(d.rateFlow.seeProfile, { name: firstName })}
        </Link>
        <Link
          href="/people"
          className="h-13 grid place-items-center rounded-full bg-white border border-line font-bold text-[15px]"
        >
          {d.rateFlow.rateAnother}
        </Link>
      </div>
    </main>
  );
}
