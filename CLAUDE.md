# Working agreements — Vibe Tag

Notes for Claude working in this repo. Product documentation lives in
`README.md`; this file is only about how we work together.

## Tagging — do this at the end of every piece of work

**The session cannot push tags.** The git credential here is scoped to the
branch `claude/app-development-m2v29w`; `git push origin <tag>` returns
HTTP 403. This is an environment limit, not something to retry.

So Özgür creates the tags. **Every time a change is finished and pushed, end
the reply with two blocks — no exceptions, no waiting to be asked:**

**1. Commands to create the tag.** Point at the exact commit, not at a branch
name, so the tag lands where it should even if the branch moves:

```bash
git fetch origin claude/app-development-m2v29w
git tag -a vX.Y <commit-sha> -m "vX.Y — <one line>"
git push origin vX.Y
```

Write the annotation message out in full — a short summary of what shipped,
so it can be pasted straight in.

**2. Commands to test that tag locally.** Include `db:reset` whenever
`prisma/schema.prisma` changed, and say so:

```bash
git fetch --tags
git checkout vX.Y
npm install           # only when dependencies changed
npm run db:reset      # only when the schema changed — stop the server first
npm run dev
```

Then a short list of what to look at, with the exact route or menu path.

Version numbering: minor bump (`v1.2` → `v1.3`) for a normal feature package,
patch (`v1.2.1`) for a fix on its own. Current: **v1.2**.

## Language

Özgür writes in Turkish; reply in Turkish. Code, comments, commit messages and
this file stay in English.

## Division of labour

Design is Özgür's. Features and content are mine. Use the existing theme —
the components in `src/components/ui.tsx`, the tokens in `globals.css` — and
do not redesign screens while adding to them.

## Before saying something is done

```bash
npm run typecheck
npm run test
npm run build
```

And verify in a real browser, in **both languages**, not just by reading the
diff. Playwright with `executablePath: '/opt/pw-browsers/chromium'` works here.

## Two rules that are the product

If a change touches either of these, add or update a test:

1. **The context lock.** "How do you know this person?" decides what may be
   said about them. A market cashier is never rated on leadership.
2. **Anonymity (§15).** Ratings are never attributed in the UI. Gold reveals
   raters, but a self-hidden rater and a fraud-protected rating outrank the
   plan, always.

Both break silently — nothing on screen looks wrong when they stop holding.
