# Build Plan — Kapitel 1, "Guten Tag! Auf Wiedersehen!" (3a–3b)

Status: **plan only, not yet executed.** Mirrors the process that shipped
2a–2c (see `CLAUDE.md` → "Where to pick up" and the process rules).

## 1. Source material (already extracted, PyMuPDF, verified against raw text)

From `NWn_A1_Glossar_Deutsch-Englisch.pdf`, pages 2–3 (Seite 3), the section
right after 2c on the same page:

**3a**
| German | English | Note |
|---|---|---|
| auf Wiedersehen | goodbye | — |
| das *(Das ist Frau Kowalski.)* | this | demonstrative pronoun |
| es | it | pronoun |
| Frau *(Guten Morgen, Frau Weber.)* | Miss / Mrs / Ms | — |
| gute Nacht | good night | — |
| guten Abend | good evening | — |
| guten Morgen | good morning | — |
| Herr *(Guten Tag, Herr Hansen.)* | Mr | — |
| Ihnen *(Wie geht es Ihnen?)* | you (formal, dat.) | pronoun |
| mein, meine | my | possessive determiner — varies by gender |

**3b**
| German | English |
|---|---|
| formell | formal |
| informell | informal |
| der Nachname, -n | last name |
| das Personalpronomen, - | personal pronoun |
| das Verb, -en | verb |
| der Vorname, -n | first name |

## 2. Proposed categorization

**Excluded (pure function words, per the standing exclusion rule):**
`das`, `es`, `Ihnen` — demonstrative/personal pronouns, same treatment as
`die`/`dir`/`du`/`ich`/`wer`/`oder` in the 2a–2c batch.

**Flagged for a decision — `mein, meine` ("my"):** Unlike the 2a–2c
adverb trio (auch/ganz/sehr, invariant), this word *inflects by gender*
(mein vs. meine) — the same case/ending-agreement complexity that
`adjective`-type entries are deliberately kept out of (PRD.md §8:
Beginner content stays to nominative case to avoid this). It doesn't fit
noun/verb/phrase either. My default plan: **exclude it this batch**,
the same way substantivized/attributive-only adjectives were excluded
in Kapitel 1's first pass — it needs its own mechanic (a possessive
slot that varies by the following noun's gender), not a forced fit.
Flagging before building rather than guessing, per the standing process
rule — say if you'd rather it went in some other way.

**Straightforward, no new decision needed (10 words):**

| id | type | de | en | glue? | draft sentence |
|---|---|---|---|---|---|
| `aufwiedersehen` | phrase | auf Wiedersehen | goodbye | true | *Auf Wiedersehen!* |
| `frau` | noun (`die`) | Frau | Mrs / Ms | false | *Das ist Frau Weber.* |
| `herr` | noun (`der`) | Herr | Mr | false | *Das ist Herr Hansen.* |
| `gutenacht` | phrase | gute Nacht | good night | false | *Gute Nacht!* |
| `gutenabend` | phrase | guten Abend | good evening | false | *Guten Abend!* |
| `gutenmorgen` | phrase | guten Morgen | good morning | false | *Guten Morgen!* |
| `formell` | adjective | formell | formal | false | *Die E-Mail ist formell.* |
| `informell` | adjective | informell | informal | false | *Die E-Mail ist informell.* |
| `nachname` | noun (`der`) | Nachname | last name | false | *Das ist mein Nachname.* ⚠️ uses "mein" incidentally — see §3 |
| `vorname` | noun (`der`) | Vorname | first name | false | *Das ist mein Vorname.* ⚠️ same |
| `personalpronomen` | noun (`das`) | Personalpronomen | personal pronoun | false | *"Ich" ist ein Personalpronomen.* |
| `verbnoun` | noun (`das`) | Verb | verb | false | *"Sprechen" ist ein Verb.* |

That's 12 words in the table, not 10 — table includes `nachname`/`vorname`
which is where excluding `mein` creates friction (see §3). `id:'verb'`
would collide in spirit with the concept of the whole `type:'verb'`
field, so I'd use `verbnoun` or `dasverb` to keep it unambiguous — small
naming call, flagging it here rather than deciding silently.

## 3. One knock-on effect of excluding "mein"

The glossary's own example sentences for `Nachname`/`Vorname` don't use
"mein" — I added it above only because "Das ist mein Nachname" is the
most natural real sentence. If `mein` is excluded as vocabulary, its
*form* still shows up incidentally inside other words' example sentences
(same as how "aus", "in", "der" etc. already appear inside sentences
without being taught standalone) — that's normal and fine, matching how
the rest of the bank already works. Flagging only so it's a conscious
choice, not a missed inconsistency.

## 4. Build steps (same process as 2a–2c)

1. Resolve the `mein, meine` question (§2) and the `verb`-id naming
   call (§2) — either here in review, or I make the same default call
   documented above and note it when I ship.
2. Write each entry: verbs get a full highlighted sentence at Stage 1
   (none in this batch — 3a/3b are all noun/adjective/phrase); nouns get
   `pluralMarker`/`pluralForm` (unlike the old starter set — see
   CLAUDE.md's noted legacy gap); every `prompt` in plain English.
3. Check every new `id` against the live file for collisions (done
   above — none currently).
4. Run the existing suite in `tests/*.js` against the *current* 71-word
   bank first, as the baseline (should still be all-green — nothing
   about this batch touches logic, only data).
5. Add the new entries to `wortfluss-full.html`.
6. Re-run `tests/*.js` against the live file. Spot-check the new
   Stage 4 distractor sets by eye (the phrase-type greetings pool is
   getting crowded — 8 fixed exclamations after this batch — worth
   confirming they still read as distinct options, not just "check
   count/uniqueness").
7. Browser-drive the new words through all 4 stages with Playwright
   (as done for 2a–2c), screenshot evidence, confirm no console errors.
8. Update `CLAUDE.md` (current state / where to pick up), `PRD.md` §8
   (word count), `ARCHITECTURE.md` if anything structural changed.

## User workflow

| Step | What's needed from you |
|---|---|
| Before I start | Your call on §2's `mein, meine` exclusion and the `verb`-id naming — or explicit go-ahead to use my default |
| After sentences are drafted | A naturalness check on the drafted sentences above, especially the two flagged with ⚠️ |
| Before merge | Diff + test results + Playwright screenshots for your review |
| After merge | Nothing — verified against the live file as usual |

Next section after this one: "Woher kommen Sie?" (4a–4c), same PDF page,
starts immediately after 3b.
