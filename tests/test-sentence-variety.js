// Guards against the "Das ist die ___." problem: 17 of 28 nouns once shared
// one literal, interchangeable carrier sentence, and 11 language adjectives
// all shared "Ich spreche ___." — both read as vague/lazy rather than as
// real example sentences. Fixed by rewriting with real variety, weaving in
// the recurring cast (see ARCHITECTURE.md §7) instead of a generic stand-in.
//
// The rule, locked down to an exact number per CLAUDE.md's process: outside
// type 'phrase' (which structurally MUST share blank:'___' for every entry —
// that's the data model, not a content-quality problem), no two words in the
// whole bank may share an identical `blank`. Zero tolerance, not a cap.
const { loadLive } = require('./extract-live');
const { WORDS } = loadLive();

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }

const blanks = new Map(); // blank string -> [ids]
for (const w of WORDS) {
  if (w.type === 'phrase') continue; // blank:'___' is mandatory for every phrase, by design
  if (!blanks.has(w.blank)) blanks.set(w.blank, []);
  blanks.get(w.blank).push(w.id);
}
for (const [blank, ids] of blanks) {
  if (ids.length > 1) {
    fail(`${ids.length} words share the identical carrier sentence "${blank}": [${ids.join(', ')}]`);
  }
}

console.log(failures === 0
  ? `PASS: every non-phrase word has its own distinct carrier sentence (${WORDS.length} words checked).`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
