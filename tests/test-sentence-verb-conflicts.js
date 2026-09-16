// Extends CLAUDE.md rule 4 beyond the `prompt` field: a word's example
// sentence (`full`/`blank`) must not show a DIFFERENT conjugated form of a
// verb that's taught elsewhere in the bank, either. Auditing the live file
// for this (not just prompts) found 32 real cases — e.g. "Niklas ist mein
// Freund." used "ist" while `sein` is taught as "bin", "Frau Weber geht zur
// Arbeit." used "geht" while `gehen` is taught as "gehe". Fixed by rewriting
// every one, chosen at full strictness: no exceptions, including "sein".
//
// A conflict = a token that IS one of a taught verb's conjugated forms, but
// is NOT that same verb's own canonical taught form (its `ans`). An exact
// match to a verb's own canonical form (reusing "komme" where kommen teaches
// "komme") is correct reinforcement, not a conflict, and is allowed.
const { loadLive } = require('./extract-live');
const { WORDS } = loadLive();

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }

// canonicalForms: verbId -> Set of its own taught (ans) forms, lowercased.
// formOwners: lowercased conjugated-row token -> Set of verbIds whose conj
// table contains that exact token (a verb can "own" multiple tokens; a
// token can belong to more than one verb only in a coincidental spelling
// overlap, which this still checks correctly per-owner).
const canonicalForms = new Map();
const formOwners = new Map();
for (const w of WORDS) {
  if (!Array.isArray(w.conj)) continue;
  canonicalForms.set(w.id, new Set(w.ans.map(a => a.toLowerCase())));
  for (const row of w.conj) {
    const tokens = row.split(/\s+/).slice(1).filter(t => t !== '...');
    for (const t of tokens) {
      const norm = t.toLowerCase();
      if (!formOwners.has(norm)) formOwners.set(norm, new Set());
      formOwners.get(norm).add(w.id);
    }
  }
}

for (const w of WORDS) {
  const tokens = w.full.match(/[a-zà-ÿ']+/gi) || [];
  for (const tok of tokens) {
    const t = tok.toLowerCase();
    if (!formOwners.has(t)) continue;
    for (const ownerId of formOwners.get(t)) {
      if (canonicalForms.get(ownerId).has(t)) continue; // exact reinforcement, fine
      fail(`[${w.id}] sentence "${w.full}" uses "${t}", a non-canonical form of ` +
        `"${ownerId}" (which teaches "${[...canonicalForms.get(ownerId)].join('/')}")`);
    }
  }
}

console.log(failures === 0
  ? `PASS: no example sentence shows a conflicting form of any taught verb (${WORDS.length} words checked).`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
