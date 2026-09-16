// Phase 1 (A1/A2 expansion) rule: a self-written example sentence may use
// ONLY words already taught in the bank, plus a short whitelist of
// scaffolding words (pronouns, sein's "ist"/"sind", articles, "und",
// "nicht", "sehr", "hier", "gut") - no sentence may require vocabulary the
// app hasn't taught. This is checked for every word EXCEPT those that
// predate the rule: the 25-word starter set, and the 46 real A1-K1 words
// added in earlier sessions before this constraint existed (both grandfathered
// rather than rewritten retroactively).
const { loadLive } = require('./extract-live');
const { WORDS } = loadLive();

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }

const GRANDFATHERED = new Set([
  // 30 real entries, A1 Kapitel 1 sections 1a-1c + pre-"Hallo"
  'autobahn','butterbrot','flasche','handtuch','kindergarten','koffer','nudel','wuerstchen','wuerstel','kursplakat',
  'heissen','kennen','machen','sammeln','zuordnen','zusammengehoeren','gut','international','bulgarisch','deutsch',
  'englisch','indonesisch','italienisch','japanisch','russisch','serbisch','tuerkisch','ungarisch','spanisch','gutentag',
  // 16 real entries, A1 Kapitel 1 sections 2a-2c
  'hoeren','lesen','spielen','person','situation','name','auch','ganz','sehr','bekannt','hallo','tschuess','ciao',
  'danke','bisbald','entschuldigung',
]);

const WHITELIST = new Set(['ich','du','er','sie','es','wir','ihr','ist','sind','ein','eine','der','die','das',
  'und','nicht','sehr','hier','gut']);
// Pure function words (prepositions, case-marked articles/pronouns) are
// already allowed as incidental scaffolding by the standing exclusion rule
// (ARCHITECTURE.md §7 "Pure function words..."), independent of this
// session's whitelist - they were never something that needed "teaching".
const FUNCTION_WORDS = new Set(['aus','in','mit','zu','nach','bei','von','auf','für','fuer','über','ueber','unter',
  'vor','hinter','neben','zwischen','durch','ohne','um','an','als','dass','ob','den','dem','des',
  'einen','einem','eines','mich','dich','sich','uns','euch']);

const safeTokens = new Set([...WHITELIST, ...FUNCTION_WORDS]);
for (const w of WORDS) {
  const pieces = [w.de, ...(w.ans || [])].filter(Boolean);
  for (const p of pieces) {
    for (const tok of p.toLowerCase().split(/[\s-]+/)) safeTokens.add(tok);
  }
  if (Array.isArray(w.conj)) {
    for (const row of w.conj) {
      for (const tok of row.split(/\s+/).slice(1)) {
        if (tok !== '...') safeTokens.add(tok.toLowerCase());
      }
    }
  }
}

const WORD_RE = /[a-zäöüß']+/g; // umlaut/ß-aware token matcher
let checked = 0;
for (const w of WORDS) {
  if (w.source === 'starter' || GRANDFATHERED.has(w.id)) continue;
  checked++;
  const ownTokens = new Set();
  [w.de, ...(w.ans || [])].forEach(p => p && p.toLowerCase().split(/[\s-]+/).forEach(t => ownTokens.add(t)));

  const tokens = w.full.toLowerCase().match(WORD_RE) || [];
  for (const t of tokens) {
    if (safeTokens.has(t) || ownTokens.has(t)) continue;
    fail(`[${w.id}] "${w.full}" has a word not yet taught and not on the whitelist: "${t}"`);
  }
}

console.log(failures === 0
  ? `PASS: every sentence outside the grandfathered set uses only taught or whitelisted words (${checked} words checked).`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
