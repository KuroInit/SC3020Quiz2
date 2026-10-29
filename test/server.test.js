const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createServer } = require('../server.js');

const publicRoot = path.join(__dirname, '..', 'public');
const server = createServer({ root: publicRoot });
let baseUrl;

test.before(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('serves the tutor page with locally bundled KaTeX and no remote renderer', async () => {
  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /\.\/assets\/katex\/katex\.min\.js/);
  assert.match(html, /\.\/assets\/katex\/katex\.min\.css/);
  assert.doesNotMatch(html, /MathJax|cdn\.jsdelivr\.net/);
});

test('serves KaTeX JS, stylesheet and same-origin font assets', async () => {
  const assets = [
    ['/assets/katex/katex.min.js', /javascript/, 200_000],
    ['/assets/katex/katex.min.css', /css/, 10_000],
    ['/assets/katex/fonts/KaTeX_Main-Regular.woff2', /font\/woff2/, 10_000],
  ];
  for (const [url, contentType, minBytes] of assets) {
    const response = await fetch(`${baseUrl}${url}`);
    const data = await response.arrayBuffer();
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get('content-type'), contentType, url);
    assert.ok(data.byteLength > minBytes, `${url} too small`);
  }
});

test('reports a local health response', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('returns 404 for missing files', async () => {
  const response = await fetch(`${baseUrl}/missing-file`);
  assert.equal(response.status, 404);
});

test('rejects traversal outside the public directory', async () => {
  const response = await fetch(`${baseUrl}/..%2fserver.js`);
  assert.equal(response.status, 403);
});

test('rejects unsupported methods', async () => {
  const response = await fetch(`${baseUrl}/`, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});
