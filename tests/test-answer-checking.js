// Exercises the live normalizeAnswer/checkAnswer: lenient on case, whitespace,
// ß/ss — never lenient on the actual word/form (CLAUDE.md rule 5).
const { loadLive } = require('./extract-live');
const { normalizeAnswer, checkAnswer, WORDS } = loadLive();

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function assert(cond, msg) { if (!cond) fail(msg); }

assert(normalizeAnswer('  Straße ') === normalizeAnswer('strasse'), 'ß/ss should be equivalent');
assert(normalizeAnswer('Hallo') === normalizeAnswer('hallo'), 'case should not matter');
assert(normalizeAnswer(' hallo ') === normalizeAnswer('hallo'), 'surrounding whitespace should not matter');
assert(normalizeAnswer('tschüs') !== normalizeAnswer('tschus'), 'ü must still be typed correctly (not stripped)');

// Every word in the live bank should accept its own correct, and reject a
// clearly wrong, answer via checkAnswer.
for (const w of WORDS) {
  const correct = checkAnswer(w.ans, w);
  assert(correct === true, `[${w.id}] checkAnswer should accept its own correct ans`);

  const messy = w.ans.map(a => '  ' + a.toUpperCase() + '  ');
  assert(checkAnswer(messy, w) === true, `[${w.id}] checkAnswer should tolerate case/whitespace`);

  const wrong = w.ans.map(() => 'xyznotarealanswer');
  assert(checkAnswer(wrong, w) === false, `[${w.id}] checkAnswer should reject a wrong answer`);
}

console.log(failures === 0
  ? `PASS: answer-checking leniency/strictness verified across ${WORDS.length} words.`
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
