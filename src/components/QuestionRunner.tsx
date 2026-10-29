import type { AnswerValue, CourseQuestion } from '../domain/types';
import { validateAnswer } from '../domain/answer.mjs';
import { MathText } from './MathText';
import { useState, type FormEvent } from 'react';

const readableKey = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

function formatAnswer(value: AnswerValue): string {
  if (value && typeof value === 'object') return Object.entries(value).map(([key, part]) => `${readableKey(key)}: ${part}`).join(' · ');
  return String(value);
}

export function QuestionRunner({
  question,
  mode,
  moduleId,
  onAttempt,
  onContinue,
  continueLabel = 'Continue'
}: {
  question: CourseQuestion;
  mode: 'checkpoint' | 'transfer' | 'practice' | 'mixed';
  moduleId: string;
  onAttempt: (record: { questionId: string; moduleId: string; mode: typeof mode; correct: boolean; correctFields: number; totalFields: number; hintUsed: boolean; response: AnswerValue; createdAt: string }) => void;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const [value, setValue] = useState<string | Record<string, string>>(question.type === 'parts' ? {} : '');
  const [hintOpen, setHintOpen] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof validateAnswer> | null>(null);

  const updatePart = (key: string, text: string) => setValue(previous => ({ ...(typeof previous === 'object' ? previous : {}), [key]: text }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const checked = validateAnswer({ type: question.type, value, expected: question.expected, tolerance: question.answerTolerance ?? 0 });
    setResult(checked);
    onAttempt({
      questionId: question.id,
      moduleId,
      mode,
      correct: checked.correct,
      correctFields: checked.correctFields,
      totalFields: checked.totalFields,
      hintUsed,
      response: value,
      createdAt: new Date().toISOString()
    });
  };
  const isEmpty = question.type === 'parts'
    ? Object.values(value as Record<string, string>).every(part => !String(part).trim())
    : !String(value).trim();
  const fields = question.type === 'parts' && question.expected && typeof question.expected === 'object'
    ? Object.keys(question.expected)
    : [];

  return <section className="question-panel" aria-labelledby={`question-${question.id}`}>
    <div className="question-meta">
      <span className={`provenance provenance-${question.provenance}`}>{question.provenance === 'official' ? 'Supplied answer' : 'Derived practice'}</span>
      <span>{question.source}</span>
    </div>
    <h3 id={`question-${question.id}`}>Your task</h3>
    <div className="question-prompt"><MathText text={question.prompt}/></div>
    <form onSubmit={submit}>
      {question.type === 'choice' && <fieldset className="choice-list">
        <legend>{question.answerFormat.label}</legend>
        {question.options?.map((option, index) => <label className="choice-option" key={`${question.id}-option-${index}`}>
          <input type="radio" name={`answer-${question.id}`} value={option} checked={value === option} onChange={() => setValue(option)}/>
          <MathText text={option}/>
        </label>)}
      </fieldset>}
      {question.type === 'numeric' && <label className="answer-field">
        <span>{question.answerFormat.label}</span>
        <input type="text" inputMode="decimal" autoComplete="off" aria-label={question.answerFormat.label} placeholder={question.answerFormat.hint} value={String(value)} onChange={event => setValue(event.target.value)} />
      </label>}
      {question.type === 'parts' && <div className="answer-fields" aria-label={question.answerFormat.label}>
        {fields.map(key => {
          const field = question.answerFormat.fields?.[key] ?? { label: readableKey(key), placeholder: 'Enter your answer' };
          const expectedPart = (question.expected as Record<string, string | number>)[key];
          return <label className="answer-field" key={key}>
            <span>{field.label}</span>
            <input type="text" inputMode={typeof expectedPart === 'number' ? 'decimal' : 'text'} autoComplete="off" aria-label={field.label} placeholder={field.placeholder} value={(value as Record<string, string>)[key] ?? ''} onChange={event => updatePart(key, event.target.value)} />
          </label>;
        })}
      </div>}
      {question.type === 'text' && <label className="answer-field">
        <span>{question.answerFormat.label}</span>
        <textarea aria-label={question.answerFormat.label} placeholder={question.answerFormat.hint} value={String(value)} onChange={event => setValue(event.target.value)} rows={3}/>
      </label>}
      <p className="input-hint" id={`hint-${question.id}`}>{question.answerFormat.hint}</p>
      <div className="question-actions">
        <button className="button button-quiet" type="button" onClick={() => { setHintOpen(open => !open); setHintUsed(true); }}>{hintOpen ? 'Hide hint' : 'Show a hint'}</button>
        <button className="button button-primary" type="submit" disabled={isEmpty}>{result ? 'Check again' : 'Check my answer'}</button>
      </div>
      {hintOpen && <div className="hint-box"><span className="hint-icon" aria-hidden="true">↳</span><MathText text={question.hint}/></div>}
    </form>
    {result && <div className={`answer-review ${result.correct ? 'review-correct' : 'review-needs-work'}`} aria-live="polite">
      <div className="review-title"><span aria-hidden="true">{result.correct ? '✓' : result.correctFields ? '◐' : '↻'}</span><strong>{result.correct ? 'Correct — review your reasoning' : result.correctFields ? `Partly right — ${result.correctFields} of ${result.totalFields} parts match` : 'Not yet — review and try again'}</strong></div>
      <p><strong>Your response:</strong> <code>{formatAnswer(value as AnswerValue)}</code></p>
      <p><strong>Expected:</strong> <MathText text={formatAnswer(question.expected)}/></p>
      <p><strong>What went well:</strong> <MathText text={result.correct ? question.review.correct : 'You have an attempt to learn from. Compare your first step with the solution below.'}/></p>
      {!result.correct && <p><strong>First divergence to check:</strong> <MathText text={question.review.firstDivergence}/></p>}
      {!result.correct && <p><strong>Try next:</strong> <MathText text={question.review.nextStep}/></p>}
      <details className="solution-details">
        <summary>Worked answer and full review</summary>
        <p><strong>Answer:</strong> <MathText text={formatAnswer(question.expected)}/></p>
        {question.explanation.map((step, index) => <p className="solution-step" key={`${question.id}-step-${index}`}><span>{index + 1}</span><MathText text={step}/></p>)}
        {result.correct && <p className="review-success"><MathText text={question.review.correct}/></p>}
        <p className="source-caption">Source status: {question.provenance === 'official' ? 'answer supplied in the course source' : 'answer is a checked derivation/transfer item'} · {question.source}</p>
      </details>
      {onContinue && <button type="button" className="button button-primary review-next" onClick={onContinue}>{continueLabel}</button>}
    </div>}
  </section>;
}
