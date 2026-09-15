// Enforces CLAUDE.md rule 4 / ARCHITECTURE.md's "verb-prompt rule": a prompt
// must never display a conjugated form that conflicts with any verb taught
// anywhere in the bank. The standing fix is "write every prompt in plain
// English" — this test checks that mechanically, across the WHOLE bank, not
// just the words being added right now.
const { loadLive } = require('./extract-live');

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }

const { WORDS } = loadLive();

// 1) Collect every conjugated verb-form token that appears anywhere in the
//    bank's conj tables (verb / separable / combo), excluding the leading
//    pronoun and any '...' ellipsis placeholder.
const conjugatedForms = new Map(); // lowercased form -> [word ids it comes from]
for (const w of WORDS) {
  if (!Array.isArray(w.conj)) continue;
  for (const row of w.conj) {
    const tokens = row.split(/\s+/).slice(1); // drop leading pronoun (ich/du/er...)
    for (const t of tokens) {
      if (t === '...') continue;
      const norm = t.toLowerCase();
      if (!conjugatedForms.has(norm)) conjugatedForms.set(norm, []);
      conjugatedForms.get(norm).push(w.id);
    }
  }
}

// 2) A prompt containing an umlaut/ß is almost certainly leaked German, not
//    plain English — catch that directly.
const GERMAN_CHARS = /[äöüßÄÖÜ]/;

for (const w of WORDS) {
  const tag = `[${w.id}]`;
  if (GERMAN_CHARS.test(w.prompt)) {
    fail(`${tag} prompt contains German-looking characters: "${w.prompt}"`);
  }

  const promptTokens = (w.prompt.toLowerCase().match(/[a-zà-ÿ']+/gi) || []);
  for (const t of promptTokens) {
    if (conjugatedForms.has(t)) {
      const sources = conjugatedForms.get(t);
      fail(`${tag} prompt contains "${t}", a conjugated form taught for [${sources.join(', ')}]: "${w.prompt}"`);
    }
  }
}

console.log(failures === 0
  ? `PASS: ${WORDS.length} prompts checked, no conflicting conjugated forms found.`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
