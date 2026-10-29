import { useEffect, useMemo, useState } from 'react';
import { allQuestions, modules, sourceMap } from '../content/course.mjs';
import type { AttemptRecord, CourseModule, CourseQuestion } from '../domain/types';
import { Diagram } from '../components/Diagram';
import { MathBlock, MathText } from '../components/MathText';
import { QuestionRunner } from '../components/QuestionRunner';
import { parseThemePreference, resolveTheme, type ThemePreference } from '../domain/theme.mjs';

type Route =
  | { page: 'dashboard' }
  | { page: 'module'; moduleId: string; tab: 'learn' | 'checkpoint' | 'transfer' }
  | { page: 'practice' }
  | { page: 'mock' }
  | { page: 'progress' }
  | { page: 'reference' };

interface ProgressState {
  schemaVersion: 1;
  activeModuleId: string;
  completedModules: string[];
  moduleStatus: Record<string, 'not-started' | 'learning' | 'checkpoint-passed' | 'complete'>;
  attempts: AttemptRecord[];
}

const STORAGE_KEY = 'sc3020-quiz-tutor-progress-v2';
const THEME_KEY = 'sc3020-theme-preference-v1';
const blankProgress: ProgressState = { schemaVersion: 1, activeModuleId: modules[0]?.id ?? '', completedModules: [], moduleStatus: {}, attempts: [] };

function readThemePreference(): ThemePreference {
  try { return parseThemePreference(localStorage.getItem(THEME_KEY)); }
  catch { return 'system'; }
}

function readProgress(): ProgressState {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<ProgressState> | null;
    if (!value || value.schemaVersion !== 1 || !Array.isArray(value.attempts) || !Array.isArray(value.completedModules)) return blankProgress;
    return { ...blankProgress, ...value, moduleStatus: value.moduleStatus ?? {}, attempts: value.attempts.slice(-500) } as ProgressState;
  } catch {
    return blankProgress;
  }
}

function getRoute(): Route {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'module' && modules.some(module => module.id === parts[1])) {
    const tab = (['learn', 'checkpoint', 'transfer'].includes(parts[2]) ? parts[2] : 'learn') as 'learn' | 'checkpoint' | 'transfer';
    return { page: 'module', moduleId: parts[1], tab };
  }
  if (['practice', 'mock', 'progress', 'reference'].includes(parts[0])) return { page: parts[0] as 'practice' | 'mock' | 'progress' | 'reference' };
  return { page: 'dashboard' };
}

function routeHash(route: Route): string {
  if (route.page === 'module') return `#/module/${route.moduleId}/${route.tab}`;
  return `#/${route.page}`;
}

function plural(count: number, word: string) { return `${count} ${word}${count === 1 ? '' : 's'}`; }
function percentage(n: number, total: number) { return total ? Math.round(n / total * 100) : 0; }

function formatLearnerAnswer(value: AttemptRecord['response']): string {
  if (value && typeof value === 'object') return Object.entries(value).map(([key, part]) => `${key}: ${part}`).join(' · ');
  return String(value ?? '—');
}
function formatExpectedAnswer(value: CourseQuestion['expected']): string {
  if (value && typeof value === 'object') return Object.entries(value).map(([key, part]) => `${key}: ${part}`).join(' · ');
  return String(value);
}

function statusLabel(status?: ProgressState['moduleStatus'][string]) {
  if (status === 'complete') return 'Transfer attempted';
  if (status === 'checkpoint-passed') return 'Checkpoint passed';
  if (status === 'learning') return 'In progress';
  return 'Not started';
}

function moduleAttemptStats(moduleId: string, attempts: AttemptRecord[]) {
  const rows = attempts.filter(attempt => attempt.moduleId === moduleId);
  return { count: rows.length, correct: rows.filter(row => row.correct).length, hints: rows.filter(row => row.hintUsed).length };
}

function Header({ route, navigate, theme, preference, onToggleTheme }: { route: Route; navigate: (next: Route) => void; theme: 'light' | 'dark'; preference: ThemePreference; onToggleTheme: () => void }) {
  const nav: { page: Route['page']; label: string; glyph: string }[] = [
    { page: 'dashboard', label: 'Home', glyph: '⌂' },
    { page: 'practice', label: 'Practice', glyph: '✎' },
    { page: 'mock', label: 'Mixed quiz', glyph: '◷' },
    { page: 'progress', label: 'Progress', glyph: '↗' },
    { page: 'reference', label: 'Formula guide', glyph: '∑' }
  ];
  return <header className="topbar">
    <button className="mobile-brand" onClick={() => navigate({ page: 'dashboard' })} aria-label="Go to dashboard"><span className="brand-mark">Q</span><span>SC3020 Study Desk</span></button>
    <div className="topbar-breadcrumb"><span>Database Systems</span><span aria-hidden="true">/</span><strong>Quiz 2</strong></div>
    <nav className="top-nav" aria-label="Main navigation">
      {nav.map(item => <button key={item.page} className={route.page === item.page ? 'top-nav-item active' : 'top-nav-item'} onClick={() => navigate({ page: item.page } as Route)}><span aria-hidden="true">{item.glyph}</span>{item.label}</button>)}
    </nav>
    <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Theme: ${preference}. Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><span className="theme-toggle-icon" aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span><span className="theme-toggle-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button>
    <div className="privacy-badge"><span className="privacy-dot"/> Saved on this device</div>
  </header>;
}

function Sidebar({ route, progress, navigate }: { route: Route; progress: ProgressState; navigate: (next: Route) => void }) {
  const courseDone = progress.completedModules.length;
  const coursePercent = percentage(courseDone, modules.length);
  return <aside className="sidebar" aria-label="Course navigation">
    <button className="sidebar-brand" onClick={() => navigate({ page: 'dashboard' })}><span className="brand-mark">Q</span><span><strong>SC3020</strong><small>QUIZ 2 STUDY DESK</small></span></button>
    <div className="course-label"><span>YOUR COURSE</span><strong>Database Systems</strong><small>Quiz 2 · Weeks 7–10</small></div>
    <button className={route.page === 'dashboard' ? 'side-link active' : 'side-link'} onClick={() => navigate({ page: 'dashboard' })}><span className="side-glyph">⌂</span>Dashboard</button>
    <div className="side-section-label">LEARNING PATH <span>{modules.length}</span></div>
    <ol className="module-nav">
      {modules.map(module => {
        const status = progress.moduleStatus[module.id];
        const active = route.page === 'module' && route.moduleId === module.id;
        return <li key={module.id}><button className={active ? 'module-nav-link active' : 'module-nav-link'} onClick={() => navigate({ page: 'module', moduleId: module.id, tab: 'learn' })}>
          <span className={`module-number ${status === 'complete' ? 'is-done' : ''}`}>{status === 'complete' ? '✓' : module.number}</span>
          <span className="module-nav-copy"><strong>{module.shortTitle}</strong><small>{module.weeks}</small></span>
        </button></li>;
      })}
    </ol>
    <div className="sidebar-bottom">
      <div className="sidebar-progress-row"><span>COURSE PROGRESS</span><strong>{coursePercent}%</strong></div>
      <div className="progress-track"><span style={{ width: `${coursePercent}%` }}/></div>
      <small>{plural(courseDone, 'module')} completed</small>
      <div className="sidebar-quick-links">
        <button className={route.page === 'practice' ? 'side-link active' : 'side-link'} onClick={() => navigate({ page: 'practice' })}><span className="side-glyph">✎</span>Practice</button>
        <button className={route.page === 'progress' ? 'side-link active' : 'side-link'} onClick={() => navigate({ page: 'progress' })}><span className="side-glyph">↗</span>Progress</button>
        <button className={route.page === 'reference' ? 'side-link active' : 'side-link'} onClick={() => navigate({ page: 'reference' })}><span className="side-glyph">∑</span>Formula guide</button>
      </div>
    </div>
  </aside>;
}

function ModuleRow({ module, status, attempts, navigate }: { module: CourseModule; status?: ProgressState['moduleStatus'][string]; attempts: AttemptRecord[]; navigate: (next: Route) => void }) {
  const stats = moduleAttemptStats(module.id, attempts);
  const progress = status === 'complete' ? 100 : status === 'checkpoint-passed' ? 70 : status === 'learning' ? 25 : 0;
  return <article className="module-row">
    <div className={`module-row-number ${status === 'complete' ? 'is-done' : ''}`}>{status === 'complete' ? '✓' : module.number}</div>
    <div className="module-row-main">
      <div className="module-row-top"><span>{module.weeks} · {module.chapter}</span><span className={`status-pill status-${status ?? 'not-started'}`}>{statusLabel(status)}</span></div>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      <div className="module-row-meta"><span>{module.lessons.length} short lessons</span><span>{module.checkpoint.length} checkpoint items</span><span>{stats.count ? `${stats.correct}/${stats.count} correct so far` : 'Question-led learning'}</span></div>
      <div className="module-progress-track"><span style={{ width: `${progress}%` }}/></div>
    </div>
    <button className="button button-outline module-open" onClick={() => navigate({ page: 'module', moduleId: module.id, tab: 'learn' })}>{status === 'not-started' || !status ? 'Start module' : 'Continue'}<span aria-hidden="true"> →</span></button>
  </article>;
}

function Dashboard({ progress, navigate }: { progress: ProgressState; navigate: (next: Route) => void }) {
  const active = modules.find(module => module.id === progress.activeModuleId) ?? modules[0];
  const attemptCount = progress.attempts.length;
  const accuracy = percentage(progress.attempts.filter(attempt => attempt.correct).length, attemptCount);
  return <div className="page dashboard-page">
    <div className="welcome-kicker"><span className="kicker-dot"/> YOUR QUIZ 2 WORKSPACE</div>
    <section className="hero-panel">
      <div className="hero-copy"><p className="eyebrow">STUDY AT YOUR PACE</p><h1>Quiz 2, made <em>manageable.</em></h1><p>Learn the idea, see the moving parts, then practise with questions that tell you exactly what to enter.</p>
        <div className="hero-actions"><button className="button button-primary" onClick={() => navigate({ page: 'module', moduleId: active.id, tab: 'learn' })}>{attemptCount ? 'Continue learning' : 'Start with Week 7'}<span aria-hidden="true"> →</span></button><button className="button button-quiet" onClick={() => navigate({ page: 'practice' })}>Jump to practice</button></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-slab"><span>R</span><span>⋈</span><span>S</span></div><div className="art-note note-one">PLAN</div><div className="art-note note-two">I/O</div><div className="art-spark">✳</div></div>
      <div className="hero-footer"><span><strong>{modules.length}</strong> quiz-aligned modules</span><span><strong>{modules.reduce((n, module) => n + module.lessons.length, 0)}</strong> short lesson units</span><span><strong>{allQuestions.length}</strong> authored practice items</span></div>
    </section>
    <div className="section-heading"><div><p className="eyebrow">YOUR LEARNING PATH</p><h2>Pick up where you need</h2></div><button className="text-link" onClick={() => navigate({ page: 'progress' })}>View progress →</button></div>
    <div className="module-list">{modules.map(module => <ModuleRow key={module.id} module={module} status={progress.moduleStatus[module.id]} attempts={progress.attempts} navigate={navigate}/>)}</div>
    <section className="source-strip"><p className="eyebrow">CONTENT SCOPE</p><h3>Mapped from the Quiz 2-tagged course notes</h3><div className="source-chip-list">{Object.entries(sourceMap).filter(([key]) => key !== 'support').map(([key, source]) => <span className="source-chip" key={key}>{source.title}</span>)}</div><p className="assessment-note">Supporting references are used for notation and assessment boundaries. Missing-source questions remain excluded rather than guessed.</p></section>
    <div className="dashboard-lower">
      <section className="tip-panel"><span className="tip-mark">✦</span><div><p className="eyebrow">A GOOD STUDY RHYTHM</p><h3>Try it on paper first.</h3><p>Write the formula, substitute values and units, then check your answer. The review will point out the first step to revisit.</p></div></section>
      <section className="snapshot-panel"><p className="eyebrow">THIS DEVICE</p><div className="snapshot-number">{accuracy}<small>%</small></div><p>accuracy across {plural(attemptCount, 'attempt')}</p><button className="text-link" onClick={() => navigate({ page: 'progress' })}>See skill breakdown →</button></section>
    </div>
    <p className="assessment-note"><strong>Scope note:</strong> this tutor is a practice aid, not an official LMS. The course notes confirm an individual physical quiz, but do not establish an official question weighting.</p>
  </div>;
}

function LessonContent({ module }: { module: CourseModule }) {
  return <div className="lesson-stack">
    <div className="outcome-banner"><div className="outcome-icon">◎</div><div><span className="eyebrow">BY THE END OF THIS MODULE</span><ul>{module.outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul></div></div>
    {module.lessons.map((lesson, index) => <article className="lesson-card" key={lesson.id}>
      <div className="lesson-card-header"><span className="lesson-index">{String(index + 1).padStart(2, '0')}</span><div><p className="eyebrow">CONCEPT {index + 1}</p><h2>{lesson.title}</h2></div><span className="source-tag">{lesson.source.split(';')[0]}</span></div>
      <p className="lesson-concept"><MathText text={lesson.concept}/></p>
      <Diagram kind={lesson.diagram} lesson={lesson}/>
      <div className="equation-card"><div className="equation-label"><span>CORE RULE</span><span>Rendered math</span></div><MathBlock text={lesson.equation}/></div>
      <div className="lesson-explain-grid"><section><h3>What it means</h3><p><MathText text={lesson.meaning}/></p></section><section><h3>Worked example</h3><p><MathText text={lesson.example}/></p></section></div>
      <div className="lesson-bottom-grid"><section><h3>Symbols</h3><dl className="symbol-list">{lesson.symbols.map(([symbol, meaning]) => <div key={`${lesson.id}-${symbol}`}><dt><MathText text={String.raw`\(${symbol}\)`}/></dt><dd><MathText text={meaning}/></dd></div>)}</dl></section><section><h3>Use it in this order</h3><ol className="step-list">{lesson.steps.map((step, stepIndex) => <li key={`${lesson.id}-step-${stepIndex}`}><span>{stepIndex + 1}</span><MathText text={step}/></li>)}</ol></section></div>
      <p className="lesson-source"><span>Source</span> {lesson.source}</p>
    </article>)}
    <div className="lesson-next-panel"><div><p className="eyebrow">READY TO CHECK YOUR UNDERSTANDING?</p><h3>Answer the checkpoint questions.</h3><p>The full question states the givens and what each blank expects.</p></div><button className="button button-primary" onClick={() => window.dispatchEvent(new CustomEvent('sc3020:open-checkpoint'))}>Start checkpoint →</button></div>
  </div>;
}

function CheckpointView({ module, onAttempt, onComplete, onContinueTransfer }: { module: CourseModule; onAttempt: (record: AttemptRecord) => void; onComplete: (passed: boolean) => void; onContinueTransfer: () => void }) {
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<Record<string, AttemptRecord>>({});
  const [finished, setFinished] = useState(false);
  const questions = module.checkpoint;
  const current = questions[index];
  const orderedRecords = questions.map(question => records[question.id]).filter((record): record is AttemptRecord => !!record);
  const score = orderedRecords.filter(record => record.correct).length;
  const passed = score >= Math.min(2, questions.length);
  const addAttempt = (record: AttemptRecord) => {
    setRecords(previous => ({ ...previous, [record.questionId]: record }));
    onAttempt(record);
  };
  const finish = () => {
    onComplete(passed);
    setFinished(true);
  };

  if (finished) return <section className="checkpoint-summary">
    <div className={passed ? 'summary-icon good' : 'summary-icon review'}>{passed ? '✓' : '↻'}</div>
    <p className="eyebrow">CHECKPOINT REVIEW</p><h2>{score} of {questions.length} correct</h2>
    <p>{score === questions.length ? 'Everything matched. You chose the right rules and kept the units/assumptions visible.' : passed ? 'You have the core idea. Review the missed step below, then choose whether to retry or move on.' : 'This checkpoint found a few ideas to revisit. Nothing is locked; use the notes or retry when ready.'}</p>
    <div className="review-list">{questions.map((question, itemIndex) => {
      const record = records[question.id];
      return <article className="review-row" key={question.id}><div className={record?.correct ? 'review-status good' : 'review-status needs-work'}>{record?.correct ? '✓' : '↻'}</div><div><strong>Question {itemIndex + 1} · {record?.correct ? 'What went well' : 'Next thing to check'}</strong><p><MathText text={record?.correct ? question.review.correct : question.review.firstDivergence}/></p>{!record?.correct && <p className="review-next-step"><MathText text={question.review.nextStep}/></p>}<div className="response-pair"><p><strong>Your response:</strong> <code>{record ? formatLearnerAnswer(record.response) : 'No response recorded'}</code></p><p><strong>Expected:</strong> <MathText text={formatExpectedAnswer(question.expected)}/></p></div><details className="review-solution"><summary>Show worked solution</summary>{question.explanation.map((step, stepIndex) => <p className="solution-step" key={`${question.id}-review-${stepIndex}`}><span>{stepIndex + 1}</span><MathText text={step}/></p>)}</details></div></article>;
    })}</div>
    <div className="summary-actions"><button className="button button-quiet" onClick={() => { setIndex(0); setRecords({}); setFinished(false); }}>Retry checkpoint</button><button className="button button-primary" onClick={onContinueTransfer}>Continue to transfer practice →</button></div>
  </section>;

  return <div className="checkpoint-flow"><div className="checkpoint-progress"><div><span className="eyebrow">CHECKPOINT · {module.shortTitle.toUpperCase()}</span><strong>Question {index + 1} of {questions.length}</strong></div><div className="mini-progress">{questions.map((question, i) => <span className={i < index ? 'done' : i === index ? 'current' : ''} key={question.id}/>)}</div></div>
    <QuestionRunner key={current.id} question={current} mode="checkpoint" moduleId={module.id} onAttempt={addAttempt} onContinue={() => index < questions.length - 1 ? setIndex(index + 1) : finish()} continueLabel={index < questions.length - 1 ? 'Next question →' : 'Review checkpoint →'}/>
    <p className="checkpoint-footnote">{plural(questions.length, 'question')} · Review opens after each answer · No penalty for revisiting lessons</p>
  </div>;
}

function TransferView({ module, onAttempt, onComplete, onBack }: { module: CourseModule; onAttempt: (record: AttemptRecord) => void; onComplete: () => void; onBack: () => void }) {
  const questions = module.transfers;
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<Record<string, AttemptRecord>>({});
  const [complete, setComplete] = useState(false);
  const current = questions[index];
  const score = questions.filter(question => records[question.id]?.correct).length;
  const capture = (attempt: AttemptRecord) => { setRecords(previous => ({ ...previous, [attempt.questionId]: attempt })); onAttempt(attempt); };
  const finish = () => { onComplete(); setComplete(true); };

  if (complete) return <section className="checkpoint-summary transfer-summary">
    <div className={score === questions.length ? 'summary-icon good' : 'summary-icon review'}>{score === questions.length ? '✓' : '↻'}</div>
    <p className="eyebrow">TRANSFER SET REVIEW</p><h2>{score} of {questions.length} correct</h2>
    <p>Review every response below—including the ones you got right. Open any worked solution to compare your steps with the full reasoning.</p>
    <div className="review-list">{questions.map((question, itemIndex) => {
      const record = records[question.id];
      return <article className="review-row" key={question.id}>
        <div className={record?.correct ? 'review-status good' : 'review-status needs-work'}>{record?.correct ? '✓' : '↻'}</div>
        <div><strong>Question {itemIndex + 1} · {record?.correct ? 'What went well' : 'First divergence to review'}</strong>
          <p><MathText text={record?.correct ? question.review.correct : question.review.firstDivergence}/></p>
          {!record?.correct && <p className="review-next-step"><strong>Try next:</strong> <MathText text={question.review.nextStep}/></p>}
          <div className="response-pair"><p><strong>Your response:</strong> <code>{record ? formatLearnerAnswer(record.response) : 'No response recorded'}</code></p><p><strong>Expected:</strong> <MathText text={formatExpectedAnswer(question.expected)}/></p></div>
          <details className="review-solution"><summary>Show worked solution</summary>{question.explanation.map((step, stepIndex) => <p className="solution-step" key={`${question.id}-transfer-${stepIndex}`}><span>{stepIndex + 1}</span><MathText text={step}/></p>)}</details>
        </div>
      </article>;
    })}</div>
    <p>Your responses are saved in this device’s progress history. Completing the set records the module; you can retry the whole set whenever you want.</p>
    <div className="summary-actions"><button className="button button-quiet" onClick={() => { setIndex(0); setRecords({}); setComplete(false); }}>Retry transfer set</button><button className="button button-primary" onClick={onBack}>Back to the module →</button></div>
  </section>;

  return <div className="transfer-page">
    <div className="transfer-intro"><span className="eyebrow">TRANSFER PRACTICE</span><h2>Can you use the idea in a new setting?</h2><p>This set has {questions.length} new questions. Each answer gets its own feedback; after the last, review every response and worked solution together.</p></div>
    <div className="checkpoint-progress"><div><span className="eyebrow">TRANSFER · {module.shortTitle.toUpperCase()}</span><strong>Transfer question {index + 1} of {questions.length}</strong></div><div className="mini-progress">{questions.map((question, itemIndex) => <span className={records[question.id] ? 'done' : itemIndex === index ? 'current' : ''} key={question.id}/>)}</div></div>
    <QuestionRunner key={current.id} question={current} mode="transfer" moduleId={module.id} onAttempt={capture} onContinue={() => index < questions.length - 1 ? setIndex(index + 1) : finish()} continueLabel={index < questions.length - 1 ? 'Next transfer question →' : 'Review all transfer solutions →'}/>
    <p className="checkpoint-footnote">{plural(questions.length, 'question')} · Answer format and hint are shown above the fields · Review after every attempt</p>
  </div>;
}

function ModulePage({ module, route, navigate, onAttempt, onCheckpointComplete, onModuleComplete }: { module: CourseModule; route: Extract<Route, { page: 'module' }>; navigate: (next: Route) => void; onAttempt: (record: AttemptRecord) => void; onCheckpointComplete: (passed: boolean) => void; onModuleComplete: () => void }) {
  const goTab = (tab: 'learn' | 'checkpoint' | 'transfer') => navigate({ page: 'module', moduleId: module.id, tab });
  return <div className="page module-page">
    <div className="breadcrumbs"><button onClick={() => navigate({ page: 'dashboard' })}>Dashboard</button><span>/</span><span>{module.weeks}</span></div>
    <section className="module-hero"><div><span className="eyebrow">MODULE {module.number} · {module.weeks.toUpperCase()}</span><h1>{module.title}</h1><p>{module.description}</p></div><div className="module-hero-stat"><strong>{module.lessons.length}</strong><span>concepts</span></div></section>
    <nav className="module-tabs" aria-label={`${module.title} sections`}>
      {([{ id: 'learn', label: 'Learn', detail: 'Concepts + diagrams' }, { id: 'checkpoint', label: 'Checkpoint', detail: `${module.checkpoint.length} questions` }, { id: 'transfer', label: 'Transfer', detail: `${module.transfers.length} questions` }] as const).map(tab => <button key={tab.id} className={route.tab === tab.id ? 'module-tab active' : 'module-tab'} onClick={() => goTab(tab.id)}><span>{tab.label}</span><small>{tab.detail}</small></button>)}
    </nav>
    {route.tab === 'learn' && <LessonContent module={module}/>}
    {route.tab === 'checkpoint' && <CheckpointView key={`checkpoint-${module.id}`} module={module} onAttempt={onAttempt} onComplete={onCheckpointComplete} onContinueTransfer={() => goTab('transfer')}/>}
    {route.tab === 'transfer' && <TransferView key={`transfer-${module.id}`} module={module} onAttempt={onAttempt} onComplete={onModuleComplete} onBack={() => goTab('learn')}/>}
  </div>;
}

function PracticePage({ onAttempt }: { onAttempt: (record: AttemptRecord) => void }) {
  const [moduleFilter, setModuleFilter] = useState('all');
  const [index, setIndex] = useState(0);
  const [key, setKey] = useState(0);
  const pool = useMemo(() => modules.filter(module => moduleFilter === 'all' || module.id === moduleFilter).flatMap(module => [...module.checkpoint, ...module.transfers].map(question => ({ module, question }))), [moduleFilter]);
  const item = pool[index % pool.length];
  return <div className="page practice-page"><div className="page-heading"><div><span className="eyebrow">LOW-PRESSURE PRACTICE</span><h1>Practise one question at a time.</h1><p>Choose a topic, answer, then use the review to decide what to revisit.</p></div><span className="study-pill">No timer</span></div>
    <div className="practice-controls"><label htmlFor="practice-module">Topic</label><select id="practice-module" value={moduleFilter} onChange={event => { setModuleFilter(event.target.value); setIndex(0); setKey(value => value + 1); }}><option value="all">All Quiz 2 topics</option>{modules.map(module => <option value={module.id} key={module.id}>{module.title}</option>)}</select><span>{pool.length} authored items</span></div>
    {item && <QuestionRunner key={`${item.question.id}-${key}`} question={item.question} mode="practice" moduleId={item.module.id} onAttempt={onAttempt} onContinue={() => { setIndex(value => (value + 1) % pool.length); setKey(value => value + 1); }} continueLabel="Next practice question →"/>}
    <p className="source-note">Items are paraphrased or derived from the listed lecture notes. Source status is shown above each prompt.</p>
  </div>;
}

function MockQuizPage({ onAttempt }: { onAttempt: (record: AttemptRecord) => void }) {
  const quizPool: { module: CourseModule; question: CourseQuestion }[] = [
    { module: modules[0], question: modules[0].checkpoint[0] },
    { module: modules[1], question: modules[1].checkpoint[0] },
    { module: modules[2], question: modules[2].checkpoint[0] },
    { module: modules[3], question: modules[3].checkpoint[0] },
    { module: modules[0], question: modules[0].checkpoint[1] },
    { module: modules[3], question: modules[3].checkpoint[2] }
  ];
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, AttemptRecord>>({});
  const [finished, setFinished] = useState(false);
  const current = quizPool[index];
  const finishQuiz = () => setFinished(true);
  const record = (attempt: AttemptRecord) => { setResults(previous => ({ ...previous, [attempt.questionId]: attempt })); onAttempt(attempt); };
  if (finished) {
    const reviewed = quizPool.map(({ question }) => ({ question, result: results[question.id] })).filter(row => row.result);
    const score = reviewed.filter(row => row.result?.correct).length;
    return <div className="page mock-page"><section className="checkpoint-summary"><div className="summary-icon good">✓</div><p className="eyebrow">MIXED QUIZ · REVIEW</p><h1>{score} of {quizPool.length} correct</h1><p>This is an unweighted practice set, not an official exam blueprint. Review each item below.</p><div className="review-list">{quizPool.map(({ question }, i) => {const result=results[question.id];return <article className="review-row" key={question.id}><div className={result?.correct?'review-status good':'review-status needs-work'}>{result?.correct?'✓':'↻'}</div><div><strong>Item {i+1} · {result?.correct?'What went well':'Review next'}</strong><p><MathText text={result?.correct?question.review.correct:question.review.firstDivergence}/></p></div></article>;})}</div><button className="button button-primary" onClick={() => {setStarted(false);setIndex(0);setResults({});setFinished(false);}}>Start a new mixed quiz</button></section></div>;
  }
  if (!started) return <div className="page mock-page"><div className="page-heading"><div><span className="eyebrow">ASSESSMENT REHEARSAL</span><h1>Mixed quiz</h1><p>A short, no-timer set across the four modules.</p></div><span className="study-pill">6 items · unweighted</span></div><section className="mock-intro"><div className="mock-number">06</div><div><h2>Practise switching topics.</h2><p>Answer six questions, one at a time. Each answer opens a review before you continue. This set is not an official quiz format; course weighting has not been verified in the source notes.</p><ul><li>Question types follow the topic, not a claimed 40/60 ratio.</li><li>Progress is saved locally after each attempt.</li><li>You can return to any module at any time.</li></ul><button className="button button-primary" onClick={() => setStarted(true)}>Start mixed quiz →</button></div></section></div>;
  return <div className="page mock-page"><div className="checkpoint-progress"><div><span className="eyebrow">MIXED QUIZ</span><strong>Item {index + 1} of {quizPool.length}</strong></div><div className="mini-progress">{quizPool.map((item, i) => <span className={i<index?'done':i===index?'current':''} key={item.question.id}/>)}</div></div><QuestionRunner key={current.question.id} question={current.question} mode="mixed" moduleId={current.module.id} onAttempt={record} onContinue={() => index < quizPool.length - 1 ? setIndex(index + 1) : finishQuiz()} continueLabel={index < quizPool.length - 1 ? 'Next item →' : 'Finish and review →'}/></div>;
}

function ProgressPage({ progress, onReset, onImport }: { progress: ProgressState; onReset: () => void; onImport: (file: File) => void }) {
  const attempted = progress.attempts.length;
  const correct = progress.attempts.filter(attempt => attempt.correct).length;
  const hints = progress.attempts.filter(attempt => attempt.hintUsed).length;
  return <div className="page progress-page"><div className="page-heading"><div><span className="eyebrow">YOUR STUDY HISTORY</span><h1>Progress you can act on.</h1><p>Use attempts and review patterns to choose what to revisit. One correct answer is not proof of mastery.</p></div><div className="progress-actions"><button className="button button-outline" onClick={() => downloadProgress(progress)}>Export JSON</button><label className="button button-outline import-button">Import JSON<input type="file" accept="application/json,.json" onChange={event => {const file=event.target.files?.[0];if(file)onImport(file);event.target.value='';}}/></label><button className="button button-danger-quiet" onClick={onReset}>Reset</button></div></div>
    <div className="metric-grid"><article><span>Questions attempted</span><strong>{attempted}</strong></article><article><span>Accuracy</span><strong>{percentage(correct, attempted)}<small>%</small></strong></article><article><span>Hints used</span><strong>{hints}</strong></article><article><span>Modules completed</span><strong>{progress.completedModules.length}<small>/{modules.length}</small></strong></article></div>
    <section className="progress-section"><div className="section-heading"><div><p className="eyebrow">SKILL BREAKDOWN</p><h2>Where to study next</h2></div></div><div className="progress-module-list">{modules.map(module=>{const stats=moduleAttemptStats(module.id,progress.attempts);const rate=percentage(stats.correct,stats.count);return <article className="progress-module" key={module.id}><div className="progress-module-head"><div><span className="eyebrow">{module.weeks} · {module.chapter}</span><h3>{module.title}</h3></div><span className="status-pill">{statusLabel(progress.moduleStatus[module.id])}</span></div><div className="progress-bar-label"><span>{stats.count?`${rate}% correct · ${stats.count} attempts`:'No attempts yet'}</span><span>{stats.hints} hints</span></div><div className="progress-track"><span style={{width:`${rate}%`}}/></div><button className="text-link" onClick={()=>window.location.hash=`#/module/${module.id}/learn`}>Review this module →</button></article>;})}</div></section>
    <section className="source-status"><div><p className="eyebrow">CONTENT BOUNDARIES</p><h2>What the sources do—and do not—say</h2></div><p>EC8 Q3’s completed total is labelled as derived; Q5’s 40,200 page-I/O total is supplied. EC8 Q7 stays excluded because its plan diagram and official key are missing. The official assessment weighting is not in the checked notes.</p></section>
  </div>;
}

function downloadProgress(progress: ProgressState) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sc3020-study-progress.json'; anchor.click(); URL.revokeObjectURL(url);
}

function ReferencePage() {
  const [query, setQuery] = useState('');
  const formulas = modules.flatMap(module => module.lessons.map(lesson => ({ module, lesson }))).filter(({ module, lesson }) => `${module.title} ${lesson.title} ${lesson.equation} ${lesson.source}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page reference-page"><div className="page-heading"><div><span className="eyebrow">FORMULA & REFERENCE</span><h1>Find a rule. Check its assumptions.</h1><p>Every formula is rendered and linked to a lesson source.</p></div></div><label className="reference-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search formulas or topics" aria-label="Search formulas or topics"/></label><div className="reference-list">{formulas.map(({module,lesson})=><article className="reference-item" key={lesson.id}><div className="reference-meta"><span>{module.weeks} · {module.chapter}</span><span>{lesson.source}</span></div><h2>{lesson.title}</h2><MathBlock text={lesson.equation}/><p><MathText text={lesson.meaning}/></p><button className="text-link" onClick={()=>window.location.hash=`#/module/${module.id}/learn`}>Open lesson →</button></article>)}{!formulas.length&&<p className="empty-state">No matching formula. Try a chapter, symbol, or topic.</p>}</div></div>;
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute);
  const [progress, setProgress] = useState<ProgressState>(readProgress);
  const [themePreference, setThemePreference] = useState<ThemePreference>(readThemePreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  const theme = resolveTheme(themePreference, systemPrefersDark);
  const completed = progress.completedModules.length;

  useEffect(() => {
    const sync = () => setRoute(getRoute());
    window.addEventListener('hashchange', sync);
    if (!window.location.hash) window.history.replaceState(null, '', '#/dashboard');
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    setSystemPrefersDark(media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111a24' : '#f4f3ef');
    try {
      if (themePreference === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, themePreference);
    } catch { /* Theme still works for this page when storage is unavailable. */ }
  }, [theme, themePreference]);
  useEffect(() => {
    const open = () => {
      if (route.page === 'module') navigate({ ...route, tab: 'checkpoint' });
    };
    window.addEventListener('sc3020:open-checkpoint', open);
    return () => window.removeEventListener('sc3020:open-checkpoint', open);
  }, [route]);

  const navigate = (next: Route) => {
    if (next.page === 'module') setProgress(previous => ({ ...previous, activeModuleId: next.moduleId, moduleStatus: { ...previous.moduleStatus, [next.moduleId]: previous.moduleStatus[next.moduleId] ?? 'learning' } }));
    const hash = routeHash(next);
    if (window.location.hash === hash) setRoute(next);
    else window.location.hash = hash;
  };

  const onAttempt = (record: AttemptRecord) => setProgress(previous => ({ ...previous, attempts: [...previous.attempts, record].slice(-500) }));
  const onCheckpointComplete = (moduleId: string, passed: boolean) => setProgress(previous => ({ ...previous, moduleStatus: { ...previous.moduleStatus, [moduleId]: passed ? 'checkpoint-passed' : (previous.moduleStatus[moduleId] === 'checkpoint-passed' ? 'checkpoint-passed' : 'learning') } }));
  const onModuleComplete = (moduleId: string) => setProgress(previous => ({ ...previous, completedModules: previous.completedModules.includes(moduleId) ? previous.completedModules : [...previous.completedModules, moduleId], moduleStatus: { ...previous.moduleStatus, [moduleId]: 'complete' } }));

  const importProgress = async (file: File) => {
    if (file.size > 1_000_000) { window.alert('That progress file is larger than 1 MB.'); return; }
    try {
      const imported = JSON.parse(await file.text()) as ProgressState;
      if (imported.schemaVersion !== 1 || !Array.isArray(imported.attempts) || !Array.isArray(imported.completedModules)) throw new Error('This is not an SC3020 progress export.');
      const accepted = window.confirm(`Import ${imported.attempts.length} saved attempts and ${imported.completedModules.length} completed modules? This replaces current local progress.`);
      if (accepted) setProgress({ ...blankProgress, ...imported, attempts: imported.attempts.slice(-500) });
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Could not read that progress file.'); }
  };

  const resetProgress = () => {
    if (window.confirm('Reset all SC3020 progress saved on this device? This cannot be undone unless you exported a backup.')) setProgress(blankProgress);
  };

  const routeContent = () => {
    if (route.page === 'dashboard') return <Dashboard progress={progress} navigate={navigate}/>;
    if (route.page === 'module') {
      const module = modules.find(item => item.id === route.moduleId) ?? modules[0];
      return <ModulePage key={module.id} module={module} route={route} navigate={navigate} onAttempt={onAttempt} onCheckpointComplete={passed=>onCheckpointComplete(module.id,passed)} onModuleComplete={()=>onModuleComplete(module.id)}/>;
    }
    if (route.page === 'practice') return <PracticePage onAttempt={onAttempt}/>;
    if (route.page === 'mock') return <MockQuizPage onAttempt={onAttempt}/>;
    if (route.page === 'progress') return <ProgressPage progress={progress} onReset={resetProgress} onImport={importProgress}/>;
    return <ReferencePage/>;
  };

  return <div className="app-shell">
    <Sidebar route={route} progress={progress} navigate={navigate}/>
    <div className="app-main"><Header route={route} navigate={navigate} theme={theme} preference={themePreference} onToggleTheme={() => setThemePreference(theme === 'dark' ? 'light' : 'dark')}/><main id="main-content">{routeContent()}</main><footer className="app-footer"><span>SC3020 Study Desk · Quiz 2 scope</span><span>Progress stays in this browser</span></footer></div>
    <div className="sr-only" aria-live="polite">{completed} of {modules.length} modules completed</div>
  </div>;
}

export default App;
