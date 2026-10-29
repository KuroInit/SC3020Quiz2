const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const katex = require('katex');

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'src', 'app', 'App.tsx'), 'utf8');
const mathSource = fs.readFileSync(path.join(root, 'src', 'components', 'MathText.tsx'), 'utf8');
const mathToken = /\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$/g;

async function loadCourse() { return import('../src/content/course.mjs'); }
function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(item => collectStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => collectStrings(item, out));
  return out;
}

test('inline math parser consumes delimiters and preserves TeX command backslashes', async () => {
  const { splitMath } = await import('../src/domain/math.mjs');
  const input = String.raw`For example: \(B=9{,}900,\ M=100:\quad M(M-1)=9{,}900\).`;
  const parts = splitMath(input);
  assert.equal(parts.length, 3);
  assert.equal(parts[0].text, 'For example: ');
  assert.equal(parts[1].math, String.raw`B=9{,}900,\ M=100:\quad M(M-1)=9{,}900`);
  assert.equal(parts[1].display, false);
  assert.equal(parts[2].text, '.');
  assert.doesNotMatch(parts.map(part => part.text).join(''), /\\\\[([]/);
});

 test('typesets all authored lesson, prompt, hint, explanation, and review math', async () => {
  const { modules } = await loadCourse();
  const all = collectStrings(modules);
  let total = 0;
  for (const text of all) {
    for (const match of text.matchAll(mathToken)) {
      const tex = match[1] ?? match[2];
      assert.ok(tex.trim(), `empty math expression in: ${text}`);
      assert.match(katex.renderToString(tex, { displayMode: match[2] !== undefined, throwOnError: true, trust: false }), /class="katex"/);
      total++;
    }
    assert.equal((text.match(/\\\(/g) ?? []).length, (text.match(/\\\)/g) ?? []).length, `unbalanced inline math delimiters: ${text}`);
    assert.equal((text.match(/\$\$/g) ?? []).length % 2, 0, `unbalanced display math delimiters: ${text}`);
  }
  assert.ok(total >= 50, `expected math throughout content, found only ${total} expressions`);
});

test('inline text and display equations use the correct KaTeX modes', () => {
  const questionSource = fs.readFileSync(path.join(root, 'src', 'components', 'QuestionRunner.tsx'), 'utf8');
  assert.match(mathSource, /displayMode:\s*display/);
  assert.match(mathSource, /display=\{!!part\.display\}/);
  assert.match(mathSource, /display=\{true\}/);
  assert.match(appSource, /<MathBlock text=\{lesson\.equation\}/);
  assert.match(questionSource, /<MathText text=\{question\.prompt\}/);
});

test('sort-merge guidance renders simple and pipelined costs with explicit phase breakdown', async () => {
  const { modules } = await loadCourse();
  const lesson = modules[0].lessons.find(item => item.id === 'sort-merge-cost');
  assert.ok(lesson);
  const expressions = [
    '4(B_R+B_S)+(B_R+B_S)=5(B_R+B_S)',
    '3(B_R+B_S)'
  ];
  for (const expression of expressions) {
    assert.ok(lesson.equation.includes(expression), `missing ${expression}`);
    assert.match(katex.renderToString(expression, { throwOnError: true }), /class="katex"/);
  }
  assert.match(lesson.meaning, /4\(B_R\+B_S\)/);
  assert.ok(lesson.example.includes(String.raw`\(`));
});

test('set-operation pointer steps typeset relation identifiers as inline math', async () => {
  const { modules } = await loadCourse();
  const lesson = modules[0].lessons.find(item => item.id === 'sort-setops');
  assert.ok(lesson);
  const step = lesson.steps[2];
  assert.ok(step.includes(String.raw`\(\mathrm{R}\)`), 'R should be delimited LaTeX');
  assert.ok(step.includes(String.raw`\(\mathrm{S}\)`), 'S should be delimited LaTeX');
  const { splitMath } = await import('../src/domain/math.mjs');
  const expressions = splitMath(step).filter(part => part.math !== undefined).map(part => part.math);
  assert.deepEqual(expressions, [String.raw`\mathrm{R}`, String.raw`\mathrm{S}`]);
  for (const expression of expressions) assert.match(katex.renderToString(expression, { throwOnError: true }), /class="katex"/);
});

test('all learning text contexts route through the shared renderer', () => {
  for (const marker of ['lesson.concept', 'lesson.meaning', 'lesson.example', 'lesson.symbols', 'lesson.steps', 'question.prompt', 'question.hint', 'question.explanation', 'question.review']) {
    assert.ok(appSource.includes(marker) || fs.readFileSync(path.join(root, 'src', 'components', 'QuestionRunner.tsx'), 'utf8').includes(marker), `missing math-rendered context ${marker}`);
  }
});

test('lesson procedure text is not constrained by the step-number badge styles', () => {
  const styles = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
  assert.match(styles, /\.step-list li>span:first-child\{/);
  assert.match(styles, /\.step-list li>\.math-text\{[^}]*min-width:0[^}]*flex:1/);
  assert.doesNotMatch(styles, /\.step-list li>span\{/);
});

test('worked-solution text is not constrained by its numbered badge styles', () => {
  const styles = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
  assert.ok(styles.includes('.solution-step>span:first-child{'), 'only the first child is the number badge');
  assert.ok(styles.includes('.solution-step>.math-text{min-width:0;flex:1}'), 'math explanation must receive the remaining width');
  assert.ok(!styles.includes('.solution-step>span{'), 'the broad span selector constrains the explanation text');
});
