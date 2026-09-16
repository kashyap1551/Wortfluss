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

- **175 words** in the bank. 71 from earlier sessions (25 hand-built
  starter words, 46 real A1 Kapitel 1 entries, sections 1a–2c) plus
  **104 new words from Phase 1, chunk 1**: the rest of A1 Kapitel 1
  (sections 3a through "kurz und klar" — greetings, grammar terms,
  numbers 0–20, countries, 5 more languages, 12 verbs). Every word now
  carries a `source` field (`'starter'` or `'{book}-K{chapter}'`) so
  coverage stays trackable now that extraction mixes A1/A2 rather than
  going strictly in book order. 3 more entries deferred to
  `DEFERRED-INTERMEDIATE.md` (mein/meine, welche/welcher — both
  gender/case-agreeing determiners with no mechanic yet; verabschieden —
  reflexive). Target: 500–800 words total, built in ~100-word chunks,
  full suite run and committed after each.
- **New standing rule for self-written sentences (Phase 1/2 only):**
  may use ONLY already-taught words plus a short whitelist (pronouns,
  `ist`/`sind`, articles, `und`/`nicht`/`sehr`/`hier`/`gut`) — no
  invented vocabulary. Enforced by `tests/test-sentence-whitelist.js`,
  which grandfathers everything written before this rule existed.
  Produced two reusable techniques (`ARCHITECTURE.md` §7): numbers
  taught via true arithmetic ("Zwei und drei ist fünf.") instead of a
  repeated counting frame, and weak nouns (Name, Herr, Buchstabe, ...)
  kept nominative to dodge an accusative declension the app has no
  mechanic for. Also required one interpretation call: `ist`/`sind` are
  now exempt from rule 4's conflicting-form check (`sein` is taught as
  `bin`) since the whitelist includes them explicitly — flagged as a
  judgment call, not something stated outright.
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
- **Hint is two-tier**, not one: tier 1 (first tap) reveals the target
  word, tier 2 (second tap) reveals the whole sentence — tier 1 alone
  reveals the one word a learner is least likely to be stuck on, since
  the English prompt already gives it away.
- **Session composition is a deliberate target**, not just a random
  draw with a glue floor: each size has a target count per category
  (verb/separable/combo counted as `"verb"`; invariant adverbs merged
  into `adjective`; see `ARCHITECTURE.md` §4 for the table). Glue words
  are drawn first within each category's slot so the Stage-4 guarantee
  (rule 3) holds regardless of distribution; a category short on supply
  redistributes its shortfall from whichever category has the most
  spare words, so session size is always exactly what was requested.
- **Test harness** at `tests/` — pure-logic tests extracted from the
  live file via `tests/extract-live.js` (word-shape, prompt/sentence
  verb-conflicts, answer-checking, sentence-variety, sentence-whitelist,
  session-building/blueprint composition, Stage-4 distractor quality)
  plus one `jsdom` interaction test (`test-hint-tiers.js`; needs
  `npm install` once — `package.json`/`node_modules` are test-only, the
  app itself still has no build step). Run all of `tests/*.js` (skip
  `extract-live.js`) before shipping any content or logic change.
- **Two content-quality bugs fixed in an earlier session**, both now
  standing rules: rule 8 (no sentence skeleton shared by more than 2
  words — over half the 55-word bank once reused one) and rule 4's
  extension to example sentences, not just prompts (a 32-case audit,
  fixed at full strictness). Full reasoning in `ARCHITECTURE.md` §7.
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

Mid-way through a 3-phase plan: Phase 0 (hint fix) and Phase 1 chunk 1
(104 words, A1 Kapitel 1's remainder) are done, committed separately.
**Do not start Phase 2 (curated batch system, replacing random session
composition) until Phase 1 chunk 1 has been reviewed** — that's an
explicit hold, not a forgotten step.

Next: Phase 1 chunk 2 — continue the 500–800-word target, drawing from
whichever of A1 (Kapitel 2 onward) or A2 (Kapitel 1 onward) is genuinely
useful next, not strictly in book order. Same process each chunk: pull
pages with PyMuPDF (never `pdftotext`), prefer the glossary's own
parenthetical example sentence when one exists, otherwise write one
under the whitelist-only rule above, defer anything requiring grammar
the app can't teach yet to `DEFERRED-INTERMEDIATE.md`, run `tests/*.js`,
verify against the live file, ship, commit per chunk.
