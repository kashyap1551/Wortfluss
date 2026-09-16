# Wortfluss — Technical Architecture

## 1. Stack

One file: `wortfluss-full.html`. Inline `<style>`, inline `<script>`,
vanilla JS. No framework, no build step, no package manager, no backend,
no database. It runs by opening the file in a browser. Every word the
app knows about lives in one JS array (`WORDS`) embedded directly in
that file.

This is deliberate, not a placeholder waiting to be "done properly" — see
PRD.md §9 and §7 on why a backend isn't justified yet.

## 2. Data model

Every entry in `WORDS` shares a common shape, extended per type.

**Fields every word has:**

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Unique, lowercase, no spaces. Must not collide with any other entry. |
| `type` | string | One of `noun`, `verb`, `separable`, `combo`, `adjective`, `phrase`. |
| `glue` | boolean | Whether this word counts toward the foundational-vocabulary threshold that unlocks Stage 4 (see §3, `stage4Unlocked`). |
| `de` | string | The German word/infinitive, as shown in Stage 1 and the summary screen. |
| `en` | string | English meaning. |
| `blank` | string | The sentence with the target blanked out as `___` (one `___` per required input). |
| `full` | string | The same sentence, correctly filled in. Must contain no `___`. |
| `enSent` | string | English translation of the full sentence. |
| `ans` | string[] | The correct filler(s), in the same left-to-right order as the `___`s in `blank`. Checked case-insensitively, whitespace-tolerant, and ß/ss-equivalent. |
| `prompt` | string | The Stage-4 practice question. **Always plain English** — see the rule below. |

**Type-specific fields:**

- **noun**: `article` (`der`/`die`/`das`), `pluralMarker` (raw glossary
  form, e.g. `"-er`), `pluralForm` (the actual correct plural word, hand-
  verified, e.g. `Handtücher`). No `conj`.
- **verb**: `conj` — exactly 6 strings, present tense, in order: ich, du,
  er/sie/es, wir, ihr, sie/Sie. One `___` in `blank`, one entry in `ans`.
- **separable**: everything a verb has, plus `prefix` and `stem` (e.g.
  `prefix:'zu', stem:'ordnen'` for *zuordnen*). Each `conj` row shows the
  split form with an ellipsis, e.g. `'ich ordne ... zu'`. **Two** `___`s
  in `blank`; `ans` has 2 entries, in order: conjugated stem, then the
  stranded prefix.
- **combo**: a verb and a noun taught in one sentence. `conj` covers the
  verb half only. Two `___`s in `blank`, two entries in `ans` (verb form,
  then noun).
- **adjective**: no `article`, no `conj`. Kept in predicate position
  (`"X ist ___"` or equivalent) specifically to avoid case/ending
  agreement, which is out of scope for Beginner content. One `___`.
  There is no dedicated adverb type — invariant adverbs (*auch*, *ganz*,
  *sehr*, ...) are typed `adjective` too, since structurally they're
  identical (no article, no conj, one invariant-word blank). This was a
  deliberate call, not an oversight: it matches the precedent already set
  by language names (*Deutsch*, *Englisch*, ...), which aren't predicate
  adjectives either but were typed `adjective` from the start. The
  tradeoff: the end-of-session summary's type label will say "adjective"
  for a word that's grammatically an adverb. Revisit only if that
  mislabeling becomes a real problem in use, not preemptively.
- **phrase**: no `article`, no `conj`. `blank` is **always** the literal
  string `'___'` — the whole phrase is the answer, which means it reuses
  the exact same checking code as everything else with no special case
  needed. `ans` has exactly 1 entry: the phrase itself, lowercased.

**The verb-prompt rule (learned from a real, widespread bug — see
`test-prompt-consistency.js`):** a `prompt` must never display a
conjugated form that conflicts with what's actually taught — neither a
different form of *this* word's own verb, nor a form of any *other* verb
taught elsewhere in the bank. The fix that's now standard practice:
**write every `prompt` in plain English.** This isn't a style
preference — it's the only way to structurally guarantee the conflict
can't happen as more verbs get added later. Apply this to every new verb
or verb-adjacent prompt going forward.

**The rule extends to example sentences too, not just prompts.** A
word's `full`/`blank` must not show a *different* conjugated form of a
verb taught elsewhere, either — an audit found 32 real cases (e.g. "Frau
Weber geht zur Arbeit." used "geht" while `gehen` is taught as "gehe";
12 of the 32 were "ist" vs. `sein`'s taught "bin"). Chosen at full
strictness, no exceptions: every one was rewritten. An exact match to a
verb's own canonical taught form (reusing "komme" where `kommen` teaches
"komme") is correct reinforcement, not a conflict, and stays allowed.
Enforced by `test-sentence-verb-conflicts.js`.

This created one real tension worth knowing about: the `adjective`
type's own documented mechanic is predicate position via "X ist ___"
(§2 above) — but `sein` is taught as `bin`, so literally every
predicate-adjective's own sentence would conflict. The fix: satisfy the
*actual* requirement (predicate position, no attributive-ending
agreement) with a different predicate-taking verb — `wirken` ("Die
Firma wirkt international."), reflexive `fühlen` ("Ich fühle mich
gut.") — instead of insisting on `sein` specifically. Reach for this
pattern for any new predicate adjective; don't reintroduce `sein` into
someone else's sentence just because it reads more naturally in the
moment.

## 3. Core functions

| Function | Does |
|---|---|
| `shuffled(arr)` | Fisher-Yates shuffle. Returns a new array; never mutates the input. |
| `buildSession(count)` | Builds a session of `count` words. For `count` in `SESSION_BLUEPRINT` (10/25/50, the only sizes the UI offers) delegates to `buildBlueprintSession` for a target composition per type; otherwise falls back to `buildUnguidedSession` (a flat glue-floor-only random draw). Either way, finishes with `ensureGlueReachable` — see §4. |
| `buildBlueprintSession(blueprint, n)` | Fills each type's target count (`SESSION_BLUEPRINT`) from that type's own pool, prioritizing `glue:true` words within each slot until `GLUE_THRESHOLD` is met bank-wide; redistributes any shortfall to whichever type has the most words left, so the result is always exactly `n` words. |
| `wordCategory(w)` | Maps a word to its blueprint category: verb/separable/combo all count as `"verb"`; everything else passes through as its own `type`. |
| `ensureGlueReachable(session)` | The last-slot glue swap-fix (§4) as a shared step, run after either session-building path. |
| `stage4Unlocked(sessionWords, currentIndex, threshold)` | True once `threshold` glue words have appeared before `currentIndex` in the session. |
| `highlightSentence(fullSentence, targets)` | Wraps each string in `targets` with a highlight span inside `fullSentence`, word-boundary matched. |
| `normalizeAnswer(s)` | `trim().toLowerCase()`, then `ß` → `ss`. The single source of truth for "is this answer close enough" — used everywhere an answer gets checked. |
| `checkAnswer(userAnswers, word)` | Stage 2's checker: every entry in `userAnswers` must `normalizeAnswer`-match the corresponding entry in `word.ans`, in order. |
| `buildStage4Options(word, allWords)` | Builds the 3 Stage-4 multiple-choice options (see §5 below for the strategy). |
| `renderStage()` | Draws whichever of the 4 stages `state.stage` currently points to. |
| `advanceStage()` / `finishWord()` | Move to the next stage / next word. Both only ever fire from an explicit user click — never a timer. |
| `revealHint()` | Fills in the on-demand hint text with the word's `de` spelling. |
| `typeLabel(type)` | Maps a `type` to its display label in the end-of-session summary (`separable` → "separable verb", etc.) |

## 4. Why session-building isn't a simple random draw

Pure unguarded shuffling was tried, tested, and rejected: across 300
simulated 10-word sessions, roughly two-thirds never included enough
foundational vocabulary to unlock Stage 4 at all. Some floor on glue-word
inclusion is therefore non-negotiable regardless of what else
`buildSession` does.

**A gap in that guarantee existed until it was caught by writing the
hundreds-of-trials test this section describes** (the test itself didn't
exist until the 2a–2c content batch): `stage4Unlocked` only counts glue
words appearing *strictly before* the current word's index, so a reserved
glue word that the final shuffle happened to place in the session's very
*last* slot didn't count toward unlocking anything reachable. Measured at
~5% of 10-word sessions and ~0.2% of 25-word sessions before the fix.
`ensureGlueReachable` now checks for exactly that case (glue count in the
whole session at or below `GLUE_THRESHOLD`, and the last slot holding a
glue word) and swaps the last slot with an earlier non-glue word when it
applies. Covered by `tests/test-session-building.js`.

**Session composition is now a deliberate target, not just a random
draw with a floor.** `SESSION_BLUEPRINT` gives each session size a target
count per category (verb/separable/combo counted together as `"verb"` —
there's no separate `"adverb"` category since none of those words are
filed that way in the data; see §2's adjective-type note):

| Category | 10-word | 25-word | 50-word | Current supply |
|---|---|---|---|---|
| noun | 3 | 8 | 15 | 28 |
| verb (+separable+combo) | 3 | 7 | 14 | 19 |
| adjective (incl. invariant adverbs) | 3 | 7 | 15 | 17 |
| phrase | 1 | 3 | 6 | 7 |

`buildBlueprintSession` fills each category's slot from that category's
own shuffled pool, prioritizing `glue:true` words first (up to whatever's
still needed to reach `GLUE_THRESHOLD` bank-wide) so the floor holds no
matter how glue words happen to be distributed across categories — in
the current bank, glue words split 8 verb / 5 adjective / 1 phrase / 0
noun, so the verb category alone can always satisfy the threshold at
every size. If a category ever has fewer words than its slot needs (not
currently the case — every category has more supply than its largest
slot), the shortfall is redistributed to whichever category currently
has the most words left to draw from, so the session is always exactly
the requested size regardless of how unevenly the bank grows. The whole
picked set is shuffled once more at the end so categories aren't grouped
together in play order. `buildSession` still finishes with
`ensureGlueReachable` regardless of which path built the session.
Regression-tested with hundreds of trials per size in
`tests/test-session-blueprint.js`, and verified end-to-end through the
real setup screen with Playwright (not just by calling `buildSession`
directly).

## 5. Stage 4: how the multiple-choice options are built

`buildStage4Options` never invents new German — every option shown is
either the real taught sentence or a sentence that's already correct
somewhere else in the data. Two strategies, by type:

- **verb / combo / separable**: the 2 wrong options are the *same*
  sentence with a *different* conjugated form substituted in (pulled
  from that word's own `conj` list), so the learner is tested on
  exactly the form just taught, by recognizing rather than typing it.
- **noun / adjective / phrase**: the 2 wrong options are borrowed
  whole from other words' `full` sentences elsewhere in the bank.
  Synthesizing a wrong noun sentence generically (e.g. swapping the
  article) was considered and rejected — several real sentences use a
  non-nominative case (e.g. *"auf der Autobahn"* is dative, not the
  nominative `die` stored in `article`), so a naive swap risks producing
  either an accidentally-correct or an ungrammatical option. Borrowing
  real, already-verified sentences sidesteps that risk entirely.

## 6. Testing approach

No test framework — plain Node scripts, run directly (`node
tests/whatever.js`), living alongside the app. Two kinds:

1. **Pure-logic tests.** `tests/extract-live.js` is the shared helper:
   regex out the live HTML file's `<script>` contents, run them in a
   Node `vm` context (with a minimal `document` stub the pure-logic
   functions never actually call), then pull `WORDS`, `buildSession`,
   `checkAnswer`, etc. out with a follow-up `vm.runInContext('WORDS',
   context)` per name — top-level `const`/`let` are context-local
   bindings, not properties of the sandbox object, the same quirk noted
   below for jsdom windows. Every other test file requires this helper
   and tests the real extracted functions — never a hand-written
   reimplementation, since testing a reimplementation only proves the
   reimplementation is correct, not the shipped file. Currently covers:
   `test-word-shape.js` (per-type field validation), 
   `test-prompt-consistency.js` and `test-sentence-verb-conflicts.js`
   (rule 4, for prompts and example sentences respectively),
   `test-answer-checking.js` (rule 5), `test-sentence-variety.js`
   (rule 8), `test-session-building.js` (the glue-reachability guarantee
   generally) and `test-session-blueprint.js` (§4's target composition
   specifically), and `test-stage4-options.js` (§5's two distractor
   strategies).
2. **Interaction tests**, using `jsdom` — **not yet built**. The plan is
   to load the real file into a simulated browser and drive it exactly
   like a person would: click buttons, type into fields, read back what
   actually rendered. This is the only way to verify DOM-level behaviors
   like "does it actually wait for Next" or "does the hint really
   appear" — a static read of the code
   can look correct and still be wrong at the DOM level.

Two things worth knowing if you extend these: top-level `const`/`let`
declared in the page's `<script>` (like `WORDS` and `state`) never
attach to `window` — reach them through `win.eval('...')` inside a
`jsdom` window, not `win.WORDS`. And anything involving `buildSession`
or `buildStage4Options` needs many trials (hundreds, not one), since
both are randomized and a single passing run proves very little.

## 7. Content extraction

Source PDFs: the official Klett "Netzwerk neu" A1 and A2 glossaries.
**Extraction must use PyMuPDF (`import pymupdf`), never `pdftotext`** —
`pdftotext` silently drops characters on this document's embedded font
(confirmed directly: it renders "Englisch" as "nglisch"). This has
already caused one near-miss and is now a standing rule, not a
suggestion.

**Sentence variety is a requirement, not a nice-to-have.** At the
55-word mark, "Ich spreche ___." was used by 11 different words, "Das
ist die ___." by 7, "Das ist der ___." by 5, "Das ist das ___." by 3 —
over half the bank reused a sentence another word already used, the
kind of interchangeable template that reads as vague rather than as a
real example. **Standing rule: no sentence skeleton (the `blank`
string) may be used by more than 2 words in the entire bank**, outside
`type:'phrase'` (which must share `blank:'___'` for every entry — that's
the data model, not a content-quality problem). Enforced by
`tests/test-sentence-variety.js`. When writing a sentence, use a real
verb and a real context — not a bare identity statement.

Two rules interact here, and it matters which one wins: every sentence
must also avoid a conflicting form of any taught verb (§2 above), which
constrains WHICH verb a sentence can use more than the variety rule
constrains its shape. In practice this means most rewritten sentences
ended up first-person ("Ich habe...", "Ich gehe...") rather than using a
named subject, since almost every verb's own canonical taught form is
its `ich`-form — a third-person subject forces a different, conflicting
form of that same verb. Reach for the **recurring cast** below
specifically when the sentence's verb is one that ISN'T taught
elsewhere (untaught verbs have no canonical form to conflict with, so
any subject works) — that's why it shows up for things like "Julia
liebt Bulgarisch." (lieben is untaught) but not for "Ich habe ein
Haus." (haben IS taught, as "habe").

| Name | Source |
|---|---|
| Julia | Netzwerk neu A1, 2a ("Hallo, ich bin Julia.") |
| Niklas | Netzwerk neu A1, 2a/2c ("Ich heiße Niklas.") |
| Frau Kowalski | Netzwerk neu A1, 3a ("Das ist Frau Kowalski.") |
| Frau Weber | Netzwerk neu A1, 3a ("Guten Morgen, Frau Weber.") |
| Herr Hansen | Netzwerk neu A1, 3a ("Guten Tag, Herr Hansen.") |

These are the glossary's own example people, not invented — reusing them
keeps the bank's example sentences feeling like one continuing set of
people instead of disconnected flashcards, the same way a real course's
dialogues do. Not every noun sentence needs a named person (e.g. "Die
Woche hat sieben Tage." doesn't), but reach for this cast before
reaching for a generic "Das ist X."

Workflow per chapter section: extract the raw text, cross-check it looks
right, then hand-categorize each entry by type (§2) — including
deciding what to leave out. Established exclusions, for consistency:

- The glossary's own article-drill entries (e.g. "das (das Würstchen)")
  — redundant with Stage 1's own article teaching.
- Pure function words (pronouns, bare prepositions, conjunctions,
  articles used alone) — absorbed into other words' example sentences
  instead of becoming standalone entries.
- Substantivized adjectives (e.g. *der/die Kranke*) and attributive-only
  adjectives that don't sit naturally in predicate position (e.g.
  *andere*) — both need their own mechanic, not a forced fit into the
  existing noun/adjective shapes.

## 8. Known technical debt / future direction

- **No database yet.** If/when one is needed, the original design
  called for Supabase/Postgres with tables: `words` (carrying
  `cefr_level` and `is_glue_word`), `verb_conjugations`,
  `exercise_templates` (with a `reviewed` boolean — nothing generated
  from source material goes live unreviewed), `users`, `user_progress`,
  `sessions`, `exam_results`. None of this is built; it's a direction,
  not a commitment, and shouldn't be built until real accounts/progress
  tracking are actually in scope (PRD.md §9).
- **Session sizing (10/25/50) doesn't scale indefinitely** — see
  PRD.md §10. Worth revisiting once the bank is meaningfully larger than
  50 words per practical session.
- **Distractor quality for Stage 4** is algorithmic, not hand-authored
  (§5) — reasonable today, worth periodically spot-checking by eye as
  more sentence shapes get added.
