const test = require('node:test');
const assert = require('node:assert/strict');
const katex = require('katex');

async function load() {
  return import('../src/content/course.mjs');
}

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(item => strings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => strings(item, out));
  return out;
}

test('course content has four sourced modules with authored checkpoints and transfer tasks', async () => {
  const { modules, sourceMap } = await load();
  assert.equal(modules.length, 4);
  assert.ok(Object.keys(sourceMap).length >= 6);
  for (const module of modules) {
    assert.ok(module.outcomes.length > 0, `${module.id} needs learning outcomes`);
    assert.ok(module.lessons.length > 0, `${module.id} needs lessons`);
    assert.ok(module.checkpoint.length >= 3, `${module.id} needs a complete checkpoint pack`);
    assert.ok(Array.isArray(module.transfers) && module.transfers.length >= 2, `${module.id} needs multiple transfer questions`);
    for (const question of [...module.checkpoint, ...module.transfers]) {
      assert.ok(question.prompt.length > 120, `${question.id} needs a standalone, sufficiently complete stem`);
      assert.ok(question.source?.length, `${question.id} needs a source`);
      assert.ok(['official', 'derived'].includes(question.provenance), `${question.id} needs official/derived provenance`);
      assert.ok(question.answerFormat?.label && question.answerFormat?.hint, `${question.id} needs an explicit answer format and hint`);
      assert.ok(question.review?.correct && question.review?.incorrect, `${question.id} needs review for right and wrong work`);
      assert.ok(question.explanation?.length, `${question.id} needs a worked explanation`);
    }
  }
});

test('math in lessons and questions is explicitly delimited and accepted by KaTeX', async () => {
  const { modules } = await load();
  const inlineOpen = String.fromCharCode(92) + '(';
  const inlineClose = String.fromCharCode(92) + ')';
  const displayOpen = '$$';
  const all = strings(modules);
  const math = [];
  for (const text of all) {
    let i = 0;
    while ((i = text.indexOf(inlineOpen, i)) >= 0) {
      const end = text.indexOf(inlineClose, i + inlineOpen.length);
      assert.ok(end >= 0, `unclosed inline math in: ${text}`);
      math.push([text.slice(i + inlineOpen.length, end), false]);
      i = end + inlineClose.length;
    }
    i = 0;
    while ((i = text.indexOf(displayOpen, i)) >= 0) {
      const end = text.indexOf(displayOpen, i + displayOpen.length);
      assert.ok(end >= 0, `unclosed display math in: ${text}`);
      math.push([text.slice(i + displayOpen.length, end), true]);
      i = end + displayOpen.length;
    }
  }
  assert.ok(math.length >= 20, `expected rich rendered math throughout content; found ${math.length}`);
  for (const [tex, displayMode] of math) assert.match(katex.renderToString(tex, { displayMode, throwOnError: true }), /class="katex"/);
});

test('answer validation is explicit for numeric, choice, and structured entries', async () => {
  const { validateAnswer } = await import('../src/domain/answer.mjs');
  assert.equal(validateAnswer({ type: 'numeric', value: '7,500', expected: 7500, tolerance: 0.01 }).correct, true);
  assert.equal(validateAnswer({ type: 'choice', value: 'both', expected: 'both' }).correct, true);
  assert.equal(validateAnswer({ type: 'parts', value: { emit: '4', advance: 'R' }, expected: { emit: '4', advance: 'R' } }).correct, true);
  assert.equal(validateAnswer({ type: 'parts', value: { emit: '4', advance: 'S' }, expected: { emit: '4', advance: 'R' } }).correct, false);
});

test('all Quiz 2 cross-lecture topics have lesson and checkpoint coverage', async () => {
  const { modules } = await load();
  const lessonIds = modules.flatMap(module => module.lessons.map(lesson => lesson.id));
  const questionIds = modules.flatMap(module => [...module.checkpoint, ...module.transfers].map(question => question.id));
  for (const id of ['grace-hybrid-hash', 'sin-vs-smj', 'bplus-tree-cost', 'postgres-qep']) assert.ok(lessonIds.includes(id), `missing lesson ${id}`);
  for (const id of ['hybrid-hash-cost', 'sin-vs-smj-choice', 'bplus-tree-io', 'postgres-qep-order']) assert.ok(questionIds.includes(id), `missing authored question ${id}`);
});

test('transfer completion presents the actual attempt, expected answer and review', () => {
  const fs = require('node:fs');
  const app = fs.readFileSync(require('node:path').join(__dirname, '..', 'src', 'app', 'App.tsx'), 'utf8');
  assert.match(app, /TRANSFER SET REVIEW/);
  assert.match(app, /Your response:/);
  assert.match(app, /Expected:/);
  assert.match(app, /question\.review\.firstDivergence/);
  assert.match(app, /question\.explanation\.map/);
});

test('transfer view advances through multiple reviewed questions before completing the set', () => {
  const fs = require('node:fs');
  const app = fs.readFileSync(require('node:path').join(__dirname, '..', 'src', 'app', 'App.tsx'), 'utf8');
  assert.match(app, /module\.transfers/);
  assert.match(app, /Transfer question \{index \+ 1\} of \{questions\.length\}/);
  assert.match(app, /Retry transfer set/);
  assert.match(app, /TRANSFER SET REVIEW/);
});

test('Vite is the sole app runtime and obsolete server/page artifacts are absent', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const pkg = require('../package.json');
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert.match(pkg.scripts.start, /vite/);
  assert.equal(vercel.buildCommand, 'npm run build');
  assert.equal(vercel.framework, 'vite');
  assert.equal(vercel.outputDirectory, 'dist');
  for (const obsolete of ['server.js', 'public', path.join('test', 'server.test.js'), 'screenshots']) {
    assert.equal(fs.existsSync(path.join(root, obsolete)), false, `${obsolete} should be removed`);
  }
});
