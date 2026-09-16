// Guards against the "Das ist die ___." problem: at the 55-word mark,
// "Ich spreche ___." was used by 11 different words, "Das ist die ___." by
// 7, "Das ist der ___." by 5, "Das ist das ___." by 3 — over half the bank
// reused a sentence another word already used. Fixed by rewriting with real
// variety, weaving in the recurring cast (ARCHITECTURE.md §7) instead of a
// generic stand-in.
//
// Standing rule (ARCHITECTURE.md §7): no sentence skeleton (the `blank`
// string) may be used by more than 2 words in the entire bank. Outside
// type 'phrase' (which structurally MUST share blank:'___' for every
// entry — that's the data model, not a content-quality problem), every
// sentence must show the word actually in use, not a generic frame.
const { loadLive } = require('./extract-live');
const { WORDS } = loadLive();

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }

const MAX_SHARED_SKELETON = 2;

const blanks = new Map(); // blank string -> [ids]
for (const w of WORDS) {
  if (w.type === 'phrase') continue; // blank:'___' is mandatory for every phrase, by design
  if (!blanks.has(w.blank)) blanks.set(w.blank, []);
  blanks.get(w.blank).push(w.id);
}
for (const [blank, ids] of blanks) {
  if (ids.length > MAX_SHARED_SKELETON) {
    fail(`${ids.length} words (over the cap of ${MAX_SHARED_SKELETON}) share the identical carrier sentence "${blank}": [${ids.join(', ')}]`);
  }
}

console.log(failures === 0
  ? `PASS: no sentence skeleton is shared by more than ${MAX_SHARED_SKELETON} words (${WORDS.length} words checked).`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
