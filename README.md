# SC3020 Quiz 2 Interactive Tutor

A local Node.js project serving the 21-lesson SC3020 Quiz 2 tutor. Equations use KaTeX 0.19.1, with its JavaScript, CSS and fonts bundled locally; rendering does not depend on MathJax, a CDN, or internet access.

## Run

Requirements: Node.js 20 or newer and npm. Install the test dependency once with `npm ci`; the app’s browser-side KaTeX files are already bundled locally.

```sh
cd /home/kur0/Documents/SC3020-Quiz-2-Tutor
npm ci
npm start
```

Open <http://127.0.0.1:4173>. Stop the server with `Ctrl+C`.

To use a different local port:

```sh
PORT=4174 npm start
```

## Verify

```sh
npm test
```

The tests verify that all 21 lesson formulas parse into KaTeX output, that local JS/CSS/font files are served, and that the Node routes handle health, missing paths, path traversal and unsupported methods.

The earlier display failure was caused by a JavaScript error: visual-lab handlers were attached during the Understand stage, before their controls existed. The app now attaches those handlers only in the Visual lab; KaTeX then renders the formula synchronously and reports success or an explicit error.

## Rendering screenshots

`./screenshots/external-merge-sort-desktop.png` and `./screenshots/external-merge-sort-mobile.png` show the exact External merge sort lesson rendered from the Node app. KaTeX renders synchronously; each screenshot includes the rendered equation and success status.

## Files

- `server.js` — dependency-free Node HTTP server, bound to loopback by default.
- `public/index.html` — the interactive tutor and synchronous KaTeX rendering hook.
- `public/assets/katex/katex.min.js` and `katex.min.css` — local renderer and styles.
- `public/assets/katex/fonts/` — KaTeX fonts; keep with the stylesheet.
- `public/assets/katex/LICENSE` — bundled package license.

Keep `public/assets/katex/` with the project. The app makes no runtime CDN requests.
