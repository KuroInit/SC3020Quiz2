const test = require('node:test');
const assert = require('node:assert/strict');

async function load() { return import('../src/content/course.mjs'); }

test('set-operation transfer has two explicitly labelled, hinted answer blanks', async () => {
  const { modules } = await load();
  const question = modules.flatMap(module => module.checkpoint.concat(...module.transfers)).find(item => item.id === 'merge-pointer-transfer');
  assert.ok(question, 'could not find the sourced set-operation transfer');
  assert.match(question.prompt, /which key should be emitted, and which input pointer should advance/i);
  assert.deepEqual(Object.keys(question.expected), ['emit', 'advance']);
  assert.equal(question.answerFormat.fields.emit.label, 'Key to emit');
  assert.equal(question.answerFormat.fields.emit.placeholder, 'e.g. 4');
  assert.equal(question.answerFormat.fields.advance.label, 'Relation to advance');
  assert.equal(question.answerFormat.fields.advance.placeholder, 'R or S');
});

test('answer checker accepts the displayed punctuation and case but rejects a wrong pointer', async () => {
  const { modules } = await load();
  const { validateAnswer } = await import('../src/domain/answer.mjs');
  const question = modules[0].transfers[0];
  assert.equal(validateAnswer({ type: question.type, value: { emit: '4', advance: 'R' }, expected: question.expected }).correct, true);
  assert.equal(validateAnswer({ type: question.type, value: { emit: '4', advance: 'S' }, expected: question.expected }).correct, false);
});
