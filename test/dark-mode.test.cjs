const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseThemePreference, resolveTheme } = require('../src/domain/theme.mjs');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app/App.tsx'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

test('manual theme preference wins over OS preference and invalid values fall back to system', () => {
  assert.equal(parseThemePreference('dark'), 'dark');
  assert.equal(parseThemePreference('light'), 'light');
  assert.equal(parseThemePreference('system'), 'system');
  assert.equal(parseThemePreference('sepia'), 'system');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

test('theme is applied before first paint and the header toggle is accessible', () => {
  assert.match(html, /sc3020-theme-preference-v1/);
  assert.match(html, /document\.documentElement\.dataset\.theme/);
  assert.match(app, /className="theme-toggle"/);
  assert.match(app, /aria-label=\{`Switch to \$\{theme === 'dark' \? 'light' : 'dark'\} mode`\}/);
  assert.match(app, /localStorage\.(?:setItem|removeItem)\(THEME_KEY/);
});

test('dark palette covers the app, cards, inputs, diagrams, and formula rendering', () => {
  assert.match(css, /:root\[data-theme="dark"\]/);
  for (const selector of ['.app-main', '.question-panel', '.lesson-card', '.answer-field input', '.diagram', '.equation-card', '.theme-toggle']) {
    assert.ok(css.includes(selector), `missing dark-mode styling for ${selector}`);
  }
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /--wash:#0c1219/);
  assert.match(css, /--teal:#78bfd4/);
  assert.match(css, /--text-accent:#91cde0/);
  assert.ok(css.includes('scrollbar-color:#526a7b #17232e'));
  assert.match(css, /--warning-bg:#242f49/);
  assert.match(css, /--warning-text:#d2dcff/);
  assert.match(css, /review-needs-work\{background:var\(--warning-bg\);border-color:#536997\}/);
  assert.doesNotMatch(css, /--warning-bg:#(?:3c3120|26384a)|border-color:#(?:665331|4c6f86)/);
});

test('incorrect dark review text and math stay white across explicit child styles', () => {
  assert.match(css, /--review-text:#fff/);
  assert.match(css, /\.answer-review\.review-needs-work\s*\*\s*\{[^}]*color:var\(--review-text\)!important\}/);
});

test('correct review response, expected, and explanation text are bright white', () => {
  assert.match(css, /html\[data-theme="dark"\] \.answer-review\.review-correct p,html\[data-theme="dark"\] \.answer-review\.review-correct p \*,html\[data-theme="dark"\] \.answer-review\.review-correct \.solution-details summary\{color:var\(--review-text\)!important\}/);
});
