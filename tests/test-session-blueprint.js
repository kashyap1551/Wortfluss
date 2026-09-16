// buildSession is randomized in three separate ways now (which glue words
// land where, which non-glue words fill each category slot, and the final
// shuffle), so a single passing run proves nothing — hundreds of trials per
// size, per ARCHITECTURE.md §6. Verifies the target composition
// (ARCHITECTURE.md §4), the pre-existing Stage 4 reachability guarantee,
// and that sessions are always exactly the requested size.
const { loadLive } = require('./extract-live');
const { WORDS, GLUE_THRESHOLD, buildSession, stage4Unlocked, SESSION_BLUEPRINT, wordCategory } = loadLive();

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function assert(cond, msg) { if (!cond) fail(msg); }

const TRIALS = 500;

for (const sizeStr of Object.keys(SESSION_BLUEPRINT)) {
  const size = Number(sizeStr);
  const blueprint = SESSION_BLUEPRINT[sizeStr];
  let neverUnlockedCount = 0;

  for (let t = 0; t < TRIALS; t++) {
    const session = buildSession(size);

    assert(session.length === size, `buildSession(${size}) returned ${session.length} words`);

    const ids = new Set(session.map(w => w.id));
    assert(ids.size === session.length, `buildSession(${size}) returned duplicate words in one session`);

    const counts = {};
    for (const w of session) { const cat = wordCategory(w); counts[cat] = (counts[cat] || 0) + 1; }
    for (const cat of Object.keys(blueprint)) {
      assert(counts[cat] === blueprint[cat],
        `buildSession(${size}) trial had ${counts[cat] || 0} "${cat}" words, expected exactly ${blueprint[cat]}`);
    }

    let unlockedAt = -1;
    for (let i = 0; i < session.length; i++) {
      if (stage4Unlocked(session, i, GLUE_THRESHOLD)) { unlockedAt = i; break; }
    }
    if (unlockedAt === -1) neverUnlockedCount++;
  }

  assert(neverUnlockedCount === 0,
    `${neverUnlockedCount}/${TRIALS} sessions of size ${size} never unlocked Stage 4`);
}

console.log(failures === 0
  ? `PASS: composition and Stage 4 reachability hold across ${TRIALS} trials for each of [${Object.keys(SESSION_BLUEPRINT).join(', ')}]-word sessions.`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
