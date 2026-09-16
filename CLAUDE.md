# Wortfluss — Project Primer

Read this first. For depth, see `PRD.md` (product) and `ARCHITECTURE.md` (technical).

## What this is

A German vocabulary learning app — chalkboard visual theme (deep charcoal
background, chalk-cream text, soft yellow accent), Libre Baskerville serif
throughout. Real vocabulary sourced from the official Klett "Netzwerk neu"
A1/A2 course glossaries. Currently one static HTML file: vanilla JS, no
framework, no backend, no database, no accounts.

Two purposes at once: a genuine tool for learning German, and a portfolio
case study demonstrating product-management work (spec writing, scoping,
user-facing decisions, shipping discipline). Both are real; neither is
decoration for the other.

## Rules that must never be broken

These were each learned the hard way — several were shipped wrong once
already and had to be rebuilt. Do not re-break them.

1. **Verbs are never introduced as a bare infinitive.** A verb's first
   appearance is always a full sentence with the actual conjugated form
   used, highlighted. The infinitive appears small and secondary, as a
   reference — never as the headline.
2. **No grammar explanation before use.** Practice first: the learner
   meets a form, uses it, gets feedback. A rule is never taught before an
   example of it.
3. **The hardest stage gates on readiness, not position.** It unlocks
   once enough foundational ("glue") vocabulary has appeared in the
   session — never on word one, never guaranteed by a fixed word count
   either (sessions are randomized; the session-builder guarantees enough
   foundational words are included specifically so this stage stays
   reachable — see `ARCHITECTURE.md`).
4. **No word's practice question — or example sentence — may show a
   conflicting form of itself, or of any other verb taught elsewhere in
   the bank.** E.g. teaching "ich spreche" and then asking "Was
   **sprichst** du?" in a prompt is a bug, not a stylistic choice —
   found and fixed once already, now enforced by
   `test-prompt-consistency.js` (prompts) and
   `test-sentence-verb-conflicts.js` (example sentences — a later audit
   found 32 real cases, including "ist" vs. `sein`'s taught "bin"
   appearing in 12 other words' sentences; fixed at full strictness, no
   exceptions).
5. **Answer-checking is lenient on purpose:** case-insensitive,
   whitespace-tolerant, and ß/ss-equivalent (not every learner has easy
   ß access). It is never lenient on the actual word/form being tested.
6. **Nothing auto-advances.** Every stage waits for an explicit "Next"
   click, whether the learner was right or wrong — they need time to
   read a correction before it's gone.
7. **Stay right-sized.** No accounts, no backend, no auth infrastructure
   until the thing it would protect actually exists and has real users.
   Sessions are anonymous and nothing is saved — that's a deliberate
   current choice, not a gap to rush to fill.
8. **No sentence skeleton (the `blank` string) may be used by more than
   2 words in the whole bank.** At the 55-word mark, "Ich spreche ___."
   was used by 11 words, "Das ist die/der/das ___." by 15 more — over
   half the bank made real content interchangeable with a generic
   stand-in, found from actual use, not a style nitpick. Outside
   `type:'phrase'` (which must share `blank:'___'` by design), enforced
   by `test-sentence-variety.js`. Reach for the recurring cast
   (`ARCHITECTURE.md` §7) before writing a generic "Das ist X" — but
   only when the sentence's verb is untaught elsewhere (rule 4 governs
   which verb a sentence can actually use).

## The process, every time

1. Business logic (word data, answer-checking, session-building) lives in
   small, pure functions with no DOM dependency — testable on their own.
2. Write a test before a logic change ships. Run it. Not optional.
3. After editing the real file, verify the result behaves the same as
   whatever was tested — extract the live functions from the actual file
   and test those, not a reimplementation of them.
4. When something is a genuine structural/design decision (not just
   "how should I word this"), ask — with a short, concrete set of
   options — rather than guessing and building on the guess.
5. Build in small, checkable pieces. Verify one thing, then move to the
   next.

## Current state

- **71 words** in the bank: the original 25-word starter set (hand-built
  for prototyping, before real content existed), 30 real entries from
  Netzwerk neu A1, Kapitel 1 (sections 1a–1c and the short unlabeled bit
  before "Hallo! Tschüs!"), and 16 real entries from Kapitel 1, section
  "Hallo! Tschüs!" (2a–2c).
- **6 word types**: noun, verb, adjective, phrase, separable verb, and
  combo (a verb+noun pair taught together). Full field reference for each
  is in `ARCHITECTURE.md`. There is no dedicated 7th type for invariant
  adverbs (e.g. *auch*, *ganz*, *sehr*) — by decision, they reuse
  `adjective` (no article/conj, one blank), matching the precedent already
  set by language names like *Deutsch*. This will keep recurring as more
  adverbs are extracted; revisit only if the mismatch becomes a real
  problem, not preemptively.
- **4-stage flow per word**: Learn → Guided fill-in → Translate →
  multiple-choice recognition (this last stage used to be open-ended
  "write your own sentence" — replaced after real-use feedback that it
  was too demanding this early; see `PRD.md`).
- **Test harness now exists** at `tests/` (it didn't before this batch,
  despite being referenced here and in `ARCHITECTURE.md`): pure-logic
  tests extracted straight from the live file via `tests/extract-live.js`
  — word-shape validation, `test-prompt-consistency.js`, answer-checking,
  hundreds-of-trials session-building/Stage-4-reachability and
  session-blueprint composition, Stage-4 distractor-quality checks,
  sentence-variety, and sentence-verb-conflicts — plus the first `jsdom`
  interaction test, `test-hint-tiers.js` (needs `npm install` once;
  `package.json`/`node_modules` are test-only, the app itself still has
  no build step). Run all of `tests/*.js` (skip `extract-live.js`, it's
  the shared helper) before shipping any content or logic change.
- **Hint is two-tier now, not one.** Tier 1 (first tap) reveals the
  target word; tier 2 (second tap) reveals the whole sentence. Tier 1
  alone used to be it, but that reveals the one word a learner is least
  likely to be stuck on — the English prompt already gives it away —
  and does nothing for the *other* words in the sentence. Verified with
  a real jsdom click-through, not just a read of `revealHint()`.
- **Session composition is now a deliberate target, not just a random
  draw with a glue floor.** Each session size has a target count per
  category — verb/separable/combo counted together as `"verb"` — with
  invariant adverbs (auch/ganz/sehr) merged into the `adjective` target
  since that's how they're actually filed (there's no separate `"adverb"`
  type in the data; see `ARCHITECTURE.md` §4 for the full table). Glue
  words are drawn first within each category's slot so the Stage-4
  guarantee (rule 3) still holds regardless of which categories they end
  up distributed across. If the bank ever grows unevenly enough that a
  category can't fill its own slot, the shortfall moves to whichever
  category has the most spare words — session size is always exactly
  what was requested. Verified with hundreds of trials per size
  (`tests/test-session-blueprint.js`) and end-to-end through the real
  setup screen with Playwright.
- **Fixed two real content-quality bugs.** (1) At the 55-word mark, "Ich
  spreche ___." was used by 11 words and "Das ist die/der/das ___." by
  15 more — over half the bank made real content interchangeable with a
  generic stand-in. Rewrote everything with real variety (rule 8),
  introducing a **recurring cast** (Julia, Niklas, Frau Kowalski, Frau
  Weber, Herr Hansen — the glossary's own example people, not invented;
  `ARCHITECTURE.md` §7) so sentences read like one continuing set of
  people instead of disconnected flashcards. (2) A follow-up audit found
  the no-conflicting-verb-form rule (rule 4) had only ever been checked
  for `prompt` fields, never for the example sentences themselves — 32
  real cases existed (12 of them "ist" vs. `sein`'s taught "bin"),
  predating both this session and the sentence-variety fix. Fixed at
  full strictness, no exceptions. The two rules interact: rule 4
  constrains which verb a sentence can use more than rule 8 constrains
  its shape, which is why most fixed sentences ended up first-person
  rather than using the cast — see `ARCHITECTURE.md` §7 for why.
- **Known legacy gap, not a bug:** the original 25-word starter set
  predates `pluralMarker`/`pluralForm` being part of the noun data model
  and doesn't have them. These fields are confirmed unused at runtime
  (grep the file — nothing reads them), so this is silently harmless; the
  test suite warns instead of failing on it. Every noun added since is
  required to have them.
- **Fixed bug:** `buildSession` guaranteed enough glue words were
  *included* in a session but not that they'd land before the *last*
  word, so `stage4Unlocked` could undercount and Stage 4 would never
  unlock — measured at ~5% of 10-word sessions before the fix. Now fixed
  (session-final glue word gets swapped earlier when it would drop the
  count below `GLUE_THRESHOLD`) and covered by
  `tests/test-session-building.js`.

## Where to pick up

Next: keep processing Netzwerk neu A1, Kapitel 1 — section "Guten Tag!
Auf Wiedersehen!" (3a–3b) onward (starts right after 2c on the same PDF
page). Same extraction process each time: pull the relevant pages with
PyMuPDF (never `pdftotext` — it silently drops characters on this
document's embedded font), categorize each entry by type, write natural
example sentences, run `tests/*.js`, verify against the live file, then
ship.
