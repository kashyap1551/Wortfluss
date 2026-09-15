// buildSession/stage4Unlocked are randomized, so a single passing run proves
// nothing (ARCHITECTURE.md §4/§6) — this runs hundreds of trials per session
// size to confirm Stage 4 stays reachable after the word bank changes.
const { loadLive } = require('./extract-live');
const { WORDS, GLUE_THRESHOLD, buildSession, stage4Unlocked } = loadLive();

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function assert(cond, msg) { if (!cond) fail(msg); }

const TRIALS = 500;
const SIZES = [10, 25, 50];

for (const size of SIZES) {
  let neverUnlockedCount = 0;
  for (let t = 0; t < TRIALS; t++) {
    const session = buildSession(size);
    assert(session.length === Math.min(size, WORDS.length),
      `buildSession(${size}) returned ${session.length} words`);

    const ids = new Set(session.map(w => w.id));
    assert(ids.size === session.length, `buildSession(${size}) returned duplicate words in one session`);

    let unlockedAt = -1;
    for (let i = 0; i < session.length; i++) {
      if (stage4Unlocked(session, i, GLUE_THRESHOLD)) { unlockedAt = i; break; }
    }
    if (unlockedAt === -1) neverUnlockedCount++;
  }
  assert(neverUnlockedCount === 0,
    `${neverUnlockedCount}/${TRIALS} sessions of size ${size} never unlocked Stage 4`);
}

// Sanity: enough glue words actually exist for the guarantee to be possible at all.
const glueCount = WORDS.filter(w => w.glue).length;
assert(glueCount >= GLUE_THRESHOLD,
  `only ${glueCount} glue words exist, below GLUE_THRESHOLD (${GLUE_THRESHOLD})`);

console.log(failures === 0
  ? `PASS: Stage 4 reachable in all ${TRIALS * SIZES.length} trials across sizes [${SIZES.join(', ')}]. (${glueCount} glue words in a ${WORDS.length}-word bank)`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
