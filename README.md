# SC3020 Quiz 2 Study Desk

A local-first, semi-LMS tutor for SC3020 Quiz 2. It is a static React/Vite app: questions, lessons, diagrams, and rendered equations run in the browser; study progress is saved in that browser's local storage.

## Run locally

Requirements: Node.js 20.19+ and npm.

```sh
cd /home/kur0/Documents/SC3020-Quiz-2-Tutor
npm ci
npm start
```

Open <http://127.0.0.1:4173>. `npm run dev` starts the same Vite development server. Stop it with `Ctrl+C`.

## Verify and build

```sh
npm test
npm run build
npm run preview
```

- `npm test` runs content-contract, answer-validation, KaTeX, and compatibility checks.
- `npm run build` type-checks the TypeScript/React app and writes the production site to `dist/`.
- `npm run preview` serves the built site at <http://127.0.0.1:4174>.

## Study workflow

- **Learn:** outcome, concept explanation, source-mapped diagram, rendered core rule, symbols, worked example, step sequence, and validity caveats.
- **Checkpoint:** complete, standalone question prompts with response-format labels and hints; after each submission the learner sees their response, expected result, what went well, and (when incorrect) the first divergence and a next step. The worked solution stays collapsed so the learner can retry first.
- **Transfer:** two new problems per module with clear response formats; work through them one at a time, review each attempt, then see every response and expected answer together with collapsed worked solutions and an option to retry the whole set.
- **Practice / mixed quiz / formula guide:** questions can be filtered and revisited. Mixed quiz is unweighted because the checked course notes do not establish a Quiz 2 question-type weighting.
- **Progress:** local attempt history and skill breakdown, with JSON export/import and reset controls.

Progress is browser- and origin-specific; it does not sync between devices. Export a JSON backup if you want to preserve or move it.

## Math, diagrams, and offline use

The app imports the locally installed KaTeX package and its stylesheet; Vite bundles those assets into `dist/`. Formula strings use explicit inline/display delimiters and are rendered with KaTeX in lessons, question prompts, hints, reviews, worked steps, and the formula guide. No CDN or external font request is required. On narrow screens, long equations and diagrams remain in bounded horizontal-scroll regions with visible swipe cues.

## Course scope and evidence boundaries

The four modules follow the checked Quiz 2 mapping: Week 7 / Chapter 15 algorithms, Week 8 / Chapter 15 indexes and access paths, Week 9 / Chapter 16 §§16.1–16.4, and Week 10 / Chapter 16 §§16.4–16.7. Course material is drawn from the six `quiz-2`-tagged notes in the Obsidian vault, with the SC3020 formula sheet as a supporting reference. Every question labels whether the answer is supplied by the course source or is a derived practice solution.

The notes mark the Week 11 schedule as tentative and do not establish the quiz's exact assessment weighting. EC8 Q3's completed total is labelled as derived; EC8 Q5's 40,200 page-I/O total is source-supplied. EC8 Q7 is excluded because its referenced plan diagram and official answer are missing. The app does not invent these missing facts.

## Project layout

- `src/app/` — routes and semi-LMS page flow.
- `src/content/course.mjs` — question-first lesson, checkpoint, transfer, answer, hint, and source data.
- `src/domain/` — answer validation, math tokenization, and TypeScript contracts.
- `src/components/` — KaTeX text/block rendering, accessible diagrams, and question runner/review.
- `src/styles.css` — responsive interface and horizontal-scroll cues.
- `test/` — source/content, answer-format, math-rendering, and legacy-route regression checks.
- `dist/` — generated static build; do not edit by hand.

The old `server.js` and `public/index.html` remain for compatibility tests and historical reference; `npm start` now launches Vite and does not serve that legacy page.

## Static hosting

Build with `npm run build` and publish the `dist/` directory. On Vercel, use the Vite preset (or Other), build command `npm run build`, and output directory `dist`. There is no backend or `.env` requirement.
