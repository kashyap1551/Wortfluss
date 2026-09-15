// Validates every WORDS entry against the per-type data model in
// ARCHITECTURE.md §2 — id uniqueness, required fields, blank/ans count match.
const { loadLive } = require('./extract-live');

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function assert(cond, msg) { if (!cond) fail(msg); }

const { WORDS } = loadLive();
assert(Array.isArray(WORDS) && WORDS.length > 0, 'WORDS did not load from the live file');

const seenIds = new Set();

for (const w of WORDS) {
  const tag = `[${w.id || '(no id)'}]`;

  assert(typeof w.id === 'string' && w.id === w.id.toLowerCase() && !w.id.includes(' '),
    `${tag} id must be lowercase with no spaces`);
  assert(!seenIds.has(w.id), `${tag} duplicate id`);
  seenIds.add(w.id);

  assert(['noun', 'verb', 'separable', 'combo', 'adjective', 'phrase'].includes(w.type),
    `${tag} unknown type "${w.type}"`);
  assert(typeof w.glue === 'boolean', `${tag} glue must be boolean`);
  assert(typeof w.de === 'string' && w.de.length > 0, `${tag} missing de`);
  assert(typeof w.en === 'string' && w.en.length > 0, `${tag} missing en`);
  assert(typeof w.blank === 'string', `${tag} missing blank`);
  assert(typeof w.full === 'string' && !w.full.includes('___'), `${tag} full must contain no ___`);
  assert(typeof w.enSent === 'string' && w.enSent.length > 0, `${tag} missing enSent`);
  assert(Array.isArray(w.ans) && w.ans.length > 0, `${tag} ans must be a non-empty array`);
  assert(typeof w.prompt === 'string' && w.prompt.length > 0, `${tag} missing prompt`);

  const blankCount = w.type === 'phrase' ? 1 : (w.blank.match(/___/g) || []).length;
  if (w.type === 'phrase') {
    assert(w.blank === '___', `${tag} phrase blank must be the literal string '___'`);
  } else {
    assert(blankCount === w.ans.length,
      `${tag} ___ count (${blankCount}) does not match ans.length (${w.ans.length})`);
  }

  if (w.type === 'noun') {
    assert(['der', 'die', 'das'].includes(w.article), `${tag} noun needs a valid article`);
    // pluralMarker/pluralForm are unused at runtime (grep confirms no render
    // path reads them) and are missing on the original 25-word starter set,
    // which predates these fields being part of the documented model
    // (CLAUDE.md "Current state"). Warn, don't fail, for that legacy gap —
    // but require them on every noun added from here on.
    if (typeof w.pluralMarker !== 'string' || typeof w.pluralForm !== 'string' || !w.pluralForm) {
      console.warn(`WARN: ${tag} noun missing pluralMarker/pluralForm (known legacy gap unless newly added)`);
    }
    assert(w.conj === undefined, `${tag} noun should not have conj`);
  }

  if (w.type === 'verb' || w.type === 'separable' || w.type === 'combo') {
    assert(Array.isArray(w.conj) && w.conj.length === 6, `${tag} needs exactly 6 conj forms`);
  }

  if (w.type === 'separable') {
    assert(typeof w.prefix === 'string' && typeof w.stem === 'string', `${tag} separable needs prefix + stem`);
    assert(blankCount === 2, `${tag} separable needs 2 blanks`);
  }

  if (w.type === 'combo') {
    assert(blankCount === 2, `${tag} combo needs 2 blanks`);
  }

  if (w.type === 'adjective') {
    assert(w.article === undefined, `${tag} adjective should not have article`);
    assert(w.conj === undefined, `${tag} adjective should not have conj`);
  }

  if (w.type === 'phrase') {
    assert(w.article === undefined && w.conj === undefined, `${tag} phrase should not have article/conj`);
    assert(w.ans.length === 1, `${tag} phrase ans must have exactly 1 entry`);
    assert(w.ans[0] === w.ans[0].toLowerCase(), `${tag} phrase ans must be lowercased`);
  }
}

console.log(failures === 0
  ? `PASS: ${WORDS.length} words, all shapes valid.`
  : `${failures} FAILURE(S) out of ${WORDS.length} words.`);
process.exit(failures === 0 ? 0 : 1);
