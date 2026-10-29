'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PROJECT_ROOT = __dirname;
const DEFAULT_PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  const data = Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': data.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  res.end(data);
}

function createServer({ root = DEFAULT_PUBLIC_ROOT } = {}) {
  const publicRoot = path.resolve(root);

  return http.createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {
        Allow: 'GET, HEAD',
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': '18',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end('Method Not Allowed');
      return;
    }

    let requestUrl;
    try {
      requestUrl = new URL(req.url || '/', 'http://localhost');
    } catch {
      send(res, 400, 'Bad Request');
      return;
    }

    if (requestUrl.pathname === '/health') {
      send(res, 200, JSON.stringify({ status: 'ok' }), 'application/json; charset=utf-8');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      send(res, 400, 'Bad Request');
      return;
    }

    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(publicRoot, relativePath);
    if (filePath !== publicRoot && !filePath.startsWith(publicRoot + path.sep)) {
      send(res, 403, 'Forbidden');
      return;
    }

    let file;
    try {
      file = await fs.readFile(filePath);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') {
        send(res, 404, 'Not Found');
      } else {
        send(res, 500, 'Internal Server Error');
      }
      return;
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': file.length,
      'Cache-Control': filePath.endsWith('.html') ? 'no-store' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    if (req.method === 'HEAD') res.end();
    else res.end(file);
  });
}

function startServer() {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }
  const server = createServer();
  server.listen(port, host, () => {
    const address = server.address();
    console.log(`SC3020 tutor: http://${host}:${address.port}`);
  });
  return server;
}

if (require.main === module) startServer();

module.exports = { createServer, startServer };
