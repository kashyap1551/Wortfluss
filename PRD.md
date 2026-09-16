# Wortfluss — Product Requirements

## 1. What this is

Wortfluss is a German vocabulary practice app built around one idea: learn
a word by using it, immediately, in a real sentence — not by memorizing
it as an isolated flashcard, and not by sitting through grammar
explanations first. It's a practice platform, not a grammar class.

## 2. Why this exists

Two honest reasons, both real:

- **Personal.** It's being built by someone actively learning German
  through the Netzwerk neu course, as the tool they wished existed
  alongside it — one that drills the actual textbook vocabulary the way
  a person really encounters it in conversation, not as a bare word list.
- **Portfolio.** It's also a case study in product management: scoping
  decisions, user-facing tradeoffs, writing specs, and shipping
  disciplined, tested increments — meant to hold up as a work sample.

*(Assumption flagged: the person building this confirmed both purposes
matter, but hasn't specified whether one should be emphasized over the
other. Written here as equally real.)*

## 3. Who it's for

**Right now:** the builder, testing it themselves as content and features
are added.

**The design target:** an absolute beginner to German — someone who
might not touch this again tomorrow, might use it once and never come
back, or might use it daily for months. There is no login and nothing is
saved between sessions, on purpose (see §7) — every session has to stand
on its own and make sense to whoever opens it, with zero prior context
assumed beyond what that single session teaches them.

## 4. Core learning philosophy

These principles shape every decision below. Each was arrived at through
actual use and, in a few cases, a mistake that had to be corrected:

- **Verbs are taught in use, never as a bare dictionary form.** The first
  time a learner sees a verb, it's already doing something in a real
  sentence, with the form they'll actually need highlighted. The
  dictionary form (infinitive) is there too, but as a small reference
  underneath — not the headline. (This was shipped backwards once, for
  8 of 9 verbs, and had to be rebuilt.)
- **No rule before an example.** Grammar is never explained up front.
  The learner meets a form, tries to use it, and gets corrected if wrong.
  Trial and error is the mechanism, not a fallback.
- **The hardest thing you can be asked to do should only be asked of you
  once you've had a real chance to warm up.** Free/harder production
  doesn't happen on word one of a session — it unlocks once a handful of
  foundational words have already come up.
- **Getting it wrong should feel safe, not punished.** Answer-checking
  forgives case, extra whitespace, and the ß/ss spelling variation.
  Wrong answers get a correction the learner can actually read (nothing
  disappears before they've had time to look at it) rather than a bare
  "incorrect."
- **A lesson is a genuine mix**, not one word type repeated ten times in
  a row — nouns, verbs, adjectives, and phrases are shuffled together
  within a session, which forces real recall instead of pattern-matching
  the category.

## 5. The lesson flow

Every word goes through the same four stages, regardless of type:

1. **Learn.** The word (or, for verbs, a full sentence using it) plus its
   English meaning. No task yet — just exposure. Advances only on an
   explicit "Got it" click.
2. **Guided.** The same sentence, now with the target word blanked out,
   and the English translation shown alongside as a memory aid. A
   "Need a hint?" link is available, in two tiers: the first tap reveals
   the target word's spelling, the second reveals the whole German
   sentence. The word alone was the *only* tier once, but real use
   showed that's the one thing a learner is least likely to be stuck
   on — the English prompt already gives it away. What they're usually
   stuck on is one of the *other* words in the sentence, which only the
   second tier actually helps with. Hidden by default, one tap at a
   time, so it still doesn't give the exercise away outright.
3. **Translate.** Given only the English meaning, the learner writes the
   whole German sentence themselves, unaided. The same two-tier hint is
   available here too.
4. **Recognize.** Three complete German sentences are shown; the learner
   picks the one that's actually correct. This replaced an earlier
   design where the learner had to compose an entirely new sentence
   from scratch — real use showed that was too big a leap at this stage
   for both the composing itself and for being asked to invent a
   *different* sentence than the one just practiced. Multiple choice
   keeps the reinforcement without demanding original writing this
   early.

At every stage, checking an answer never silently moves the learner
forward — right or wrong, a "Next" button appears and waits for them to
click it.

## 6. Word types

Six types are supported, because the real textbook vocabulary doesn't
fit a single "word + translation" shape:

| Type | What it is | How it's tested |
|---|---|---|
| noun | A German noun with its article | Fill in the noun (and implicitly, recall the right article) in a real sentence |
| verb | A regular or irregular verb | Fill in the correct conjugated form in a real sentence |
| separable verb | A verb whose prefix detaches and moves to the end of the clause (e.g. *zuordnen* → "Ich ordne ... zu") | Two blanks in one sentence: the conjugated stem and the stranded prefix |
| combo | A verb and a noun taught together in one sentence (e.g. *fahren* + *der Zug*) | Two blanks, one per word, since two vocabulary items are being introduced at once |
| adjective | A descriptive word, kept in predicate position (e.g. "Der Kaffee ist ___") to avoid case-agreement complexity | Fill in the adjective |
| phrase | A fixed expression with no meaningful blank to make (e.g. "guten Tag") | Practiced and recalled as a whole unit, not forced into a fill-in-the-blank shape |

## 7. Session mechanics

- A learner picks a word count (10, 25, or 50) and starts. Within that,
  words are drawn **randomly** from the whole bank each time, not in a
  fixed order — confirmed as the right call precisely because there's no
  login and no saved progress: every session is a fresh, independent
  draw for whoever happens to be using it.
- Randomness has two guardrails, not one. First: enough foundational
  vocabulary is always included so the hardest stage (§5, stage 4) never
  becomes unreachable in a given session. Unguarded randomness was
  tested and found to break this roughly two-thirds of the time on a
  10-word session — this isn't a hypothetical concern, it was measured.
  Second: each session targets a fixed mix of word types (nouns, verbs,
  adjectives, phrases) rather than letting the draw land wherever it
  lands — a 10-word session that happened to draw nine phrases and one
  verb would still "work" mechanically but wouldn't feel like a real
  mixed lesson (§4's "genuine mix" principle). See `ARCHITECTURE.md` §4
  for the exact target counts per size.
- **No accounts, no login, no saved progress**, on purpose. This is a
  deliberate current scope decision (§9), not an oversight.

## 8. Content and scope

Real vocabulary is sourced from the official Klett "Netzwerk neu" course
glossaries — A1 and A2 provided, combined roughly 5,300 entries. The
glossary's own license permits reproduction for personal teaching use,
which covers this project. B1/B2 will be added if and when those
glossaries are provided.

**Current coverage:** 175 words — a hand-built 25-word starter set used
to prototype the mechanics before real content existed, plus 150 real
entries from A1 Kapitel 1 in full (sections 1a through "kurz und klar").
**Target: 500–800 words**, drawing from A1 and A2 mixed together — both
map to the Beginner tier, and book order is bookkeeping, not curriculum,
so extraction no longer proceeds strictly chapter-by-chapter. Built in
chunks of roughly 100 words, each tested and shipped independently.
Entries that need grammar the app can't teach at the Beginner level yet
(reflexive verbs, case-governed verbs, subordinating conjunctions,
comparatives/superlatives) are deferred to `DEFERRED-INTERMEDIATE.md`
with a reason, not silently dropped — 3 so far.

Beginner-level content stays to nominative case, present tense, and
simple sentence structure. More complex grammar (other cases, more
elaborate structure) is reserved for an eventual Intermediate tier,
specifically because choosing "Intermediate" would itself be the
learner's signal that they're ready for it.

## 9. Explicitly out of scope, for now

Each of these was considered and deliberately deferred, not overlooked:

- User accounts, login, or any form of identity
- Saved progress or session history
- A backend or database (current state: a single static HTML file)
- Support for languages other than German
- Grammar explanations or reference material
- A dedicated mobile app

The rule for revisiting any of these: build the heavier thing only once
the need it would serve is real and has actually shown up, not in
anticipation of it.

## 10. Open questions / near-term considerations

- The three session-size options (10/25/50) were fine at 55 words; at
  175 and heading toward 500–800, a 50-word cap means most content is
  rarely seen through pure random draws alone. This is exactly what
  Phase 2's planned curated batch system (pre-built, named word lists
  per size, validated for composition/glue/variety) is meant to address —
  not yet built; holding on it until Phase 1's content is reviewed.
- The multiple-choice "wrong answer" options are generated automatically
  (see `ARCHITECTURE.md` for how) rather than hand-written per word —
  worth periodically spot-checking that they stay genuinely plausible as
  more word types and sentence shapes get added.
- No error-tracking or usage data exists yet. If real users beyond the
  builder start using this, that's a reasonable trigger to reconsider
  §9's "no accounts" stance — not before.
