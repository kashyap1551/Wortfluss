// The first jsdom interaction test in this project (ARCHITECTURE.md §6
// flagged this category as "not yet built" until now). Loads the real file
// into a simulated browser and clicks the actual hint button, the way a
// learner would - a static read of revealHint() can look correct and still
// be wrong at the DOM level.
//
// Covers the two-tier hint fix: tier 1 (first click) reveals the target
// word - the least useful thing to reveal, since the English prompt
// already gives it away - tier 2 (second click) reveals the whole German
// sentence, which actually helps with the OTHER words in it. Tier 2 must
// never appear before tier 1 is clicked.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function assert(cond, msg) { if (!cond) fail(msg); }

const htmlPath = path.join(__dirname, '..', 'wortfluss-full.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function loadDom() {
  // runScripts:'dangerously' executes the page's own <script>; no
  // resources:'usable', so the Google Fonts <link> is never fetched.
  return new JSDOM(html, { runScripts: 'dangerously', url: 'file://' + htmlPath });
}

function forceStage(dom, wordId, stage) {
  const { window } = dom;
  // Top-level const/let in the inline <script> never attach to `window`
  // (ARCHITECTURE.md §6) - reach them through win.eval, not win.WORDS.
  const built = window.eval(`
    (function() {
      const w = WORDS.find(x => x.id === ${JSON.stringify(wordId)});
      if (!w) return { error: 'no such word: ' + ${JSON.stringify(wordId)} };
      state = { level: 'Beginner', sessionWords: [w], wordIndex: 0, stage: ${stage}, learned: [] };
      showScreen('scr-session');
      renderStage();
      return { ok: true, type: w.type, de: w.de, full: w.full };
    })();
  `);
  return built;
}

function testStage(stage) {
  const dom = loadDom();
  const window = dom.window;
  const document = window.document;
  // A verb word so the tier-1/tier-2 content is unambiguous (de = infinitive,
  // full = a whole sentence, clearly different strings).
  const built = forceStage(dom, 'wohnen', stage);
  assert(built.ok, `stage ${stage}: failed to force session (${built.error || ''})`);
  if (!built.ok) return;

  const hintLink = document.getElementById('hint-link');
  const hintText = document.getElementById('hint-text');
  assert(hintLink, `stage ${stage}: hint-link button should exist`);
  assert(hintText, `stage ${stage}: hint-text span should exist`);
  if (!hintLink || !hintText) return;

  // Before any click: nothing revealed yet.
  assert(hintText.textContent.trim() === '', `stage ${stage}: hint-text should start empty, got "${hintText.textContent}"`);
  assert(hintLink.textContent === 'Need a hint?', `stage ${stage}: initial hint-link label wrong: "${hintLink.textContent}"`);
  assert(!hintText.textContent.includes(built.full), `stage ${stage}: full sentence must not appear before ANY click`);

  // Tier 1: click once.
  hintLink.dispatchEvent(new window.Event('click', { bubbles: true }));
  assert(hintText.textContent.includes(built.de), `stage ${stage}: tier 1 should reveal the target word ("${built.de}"), got "${hintText.textContent}"`);
  assert(!hintText.textContent.includes(built.full), `stage ${stage}: tier 2 (full sentence) must not appear after only 1 click, got "${hintText.textContent}"`);
  assert(hintLink.style.display !== 'none', `stage ${stage}: hint-link should still be visible after tier 1 (there's a second tier)`);
  assert(hintLink.textContent !== 'Need a hint?', `stage ${stage}: hint-link label should change after tier 1 to invite a second tap`);

  // Tier 2: click again.
  hintLink.dispatchEvent(new window.Event('click', { bubbles: true }));
  assert(hintText.textContent.includes(built.full), `stage ${stage}: tier 2 should reveal the full sentence ("${built.full}"), got "${hintText.textContent}"`);
  assert(hintLink.style.display === 'none', `stage ${stage}: hint-link should hide once both tiers are used`);
}

testStage(2);
testStage(3);

console.log(failures === 0
  ? 'PASS: two-tier hint (target word, then full sentence) verified at both Stage 2 and Stage 3 via real DOM clicks.'
  : `${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
