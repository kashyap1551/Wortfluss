// buildStage4Options never invents new German (ARCHITECTURE.md §5), but the
// two families work differently:
//  - noun/adjective/phrase: wrong options are real `full` sentences borrowed
//    from elsewhere in the bank.
//  - verb/combo/separable: wrong options are the SAME sentence with a
//    different (deliberately wrong-in-context) conjugated form substituted
//    in from the word's own conj list — they are not expected to match any
//    other word's full sentence, so that check does not apply to them.
// Randomized, so many trials.
const { loadLive } = require('./extract-live');
const { WORDS, buildStage4Options } = loadLive();

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function assert(cond, msg) { if (!cond) fail(msg); }

const TRIALS = 20;
const realSentences = new Set(WORDS.map(w => w.full));
const CONJUGATED_TYPES = ['verb', 'combo', 'separable'];

// The static (non-blank) scaffold of a sentence, in order — used to confirm
// a substituted-conjugation wrong option didn't mangle anything else.
function scaffoldOf(blank) {
  return blank.split('___');
}

for (const w of WORDS) {
  for (let t = 0; t < TRIALS; t++) {
    const options = buildStage4Options(w, WORDS);
    assert(Array.isArray(options) && options.length === 3,
      `[${w.id}] buildStage4Options should return exactly 3 options`);

    const texts = options.map(o => (typeof o === 'string' ? o : o.text));
    assert(texts.includes(w.full), `[${w.id}] the real sentence must be among the options`);

    const uniqueTexts = new Set(texts);
    assert(uniqueTexts.size === texts.length, `[${w.id}] options should not repeat the same sentence twice`);

    const wrongTexts = texts.filter(txt => txt !== w.full);

    if (CONJUGATED_TYPES.includes(w.type) && Array.isArray(w.conj)) {
      const scaffold = scaffoldOf(w.blank);
      for (const text of wrongTexts) {
        for (const piece of scaffold) {
          assert(piece === '' || text.includes(piece),
            `[${w.id}] wrong option "${text}" lost part of the sentence scaffold ("${piece}")`);
        }
      }
    } else {
      for (const text of wrongTexts) {
        assert(realSentences.has(text),
          `[${w.id}] option "${text}" is not a real sentence taught anywhere in the bank`);
      }
    }
  }
}

console.log(failures === 0
  ? `PASS: Stage 4 options verified for all ${WORDS.length} words across ${TRIALS} trials each.`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
