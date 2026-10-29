const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const katex = require('katex');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const match = html.match(/const formulaNotes = \{([\s\S]*?)\n\};\nconst stageNames=/);
assert.ok(match, 'could not locate formulaNotes data object');
const formulas = vm.runInNewContext(`const formulaNotes = {${match[1]}\n};\nformulaNotes`);

test('typesets the lesson immediately and only attaches lab handlers in the visual stage', () => {
  assert.match(html, /attach\(l\);\s*renderEquations\(content\)/);
  assert.match(html, /if\(stage===1\)attachLab\(l\)/);
});

test('all 21 lesson equations produce KaTeX HTML', () => {
  assert.equal(Object.keys(formulas).length, 21);
  for (const [lessonId, note] of Object.entries(formulas)) {
    const rendered = katex.renderToString(note.latex, { displayMode: true, throwOnError: true });
    assert.match(rendered, /class="katex"/, `${lessonId} did not produce rendered math`);
  }
});