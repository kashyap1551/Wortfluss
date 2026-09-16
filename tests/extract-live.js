// Shared helper: pulls the live <script> contents out of wortfluss-full.html
// and runs them in a sandbox, so tests exercise the real shipped functions —
// never a hand-written reimplementation. See ARCHITECTURE.md §6.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadLive() {
  const htmlPath = path.join(__dirname, '..', 'wortfluss-full.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error('Could not find <script> block in wortfluss-full.html');
  const scriptSrc = match[1];

  // Document is never actually called by the pure-logic functions we test
  // (shuffled, buildSession, stage4Unlocked, normalizeAnswer, checkAnswer,
  // buildStage4Options, typeLabel) — this stub only exists so the script's
  // top-level function *definitions* parse without a real DOM.
  const stubDocument = {
    querySelectorAll: () => [],
    getElementById: () => ({ classList: { add() {}, remove() {} }, dataset: {}, style: {} }),
    createElement: () => ({}),
  };

  const sandbox = { document: stubDocument, window: {}, console };
  const context = vm.createContext(sandbox);
  vm.runInContext(scriptSrc, context, { filename: 'wortfluss-full.html (inline script)' });

  // Top-level const/let in the script are context-local bindings, not
  // properties of the sandbox object (same quirk ARCHITECTURE.md §6 notes
  // for jsdom windows) — pull each one out with a follow-up eval instead.
  const names = ['WORDS', 'GLUE_THRESHOLD', 'shuffled', 'buildSession', 'stage4Unlocked',
    'normalizeAnswer', 'checkAnswer', 'buildStage4Options', 'typeLabel', 'highlightSentence',
    'SESSION_BLUEPRINT', 'VERB_TYPES', 'wordCategory', 'buildBlueprintSession',
    'buildUnguidedSession', 'ensureGlueReachable'];
  const out = {};
  for (const name of names) {
    out[name] = vm.runInContext(name, context);
  }
  return out;
}

module.exports = { loadLive };
