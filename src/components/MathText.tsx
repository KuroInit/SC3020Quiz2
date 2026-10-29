import katex from 'katex';
import type { ReactNode } from 'react';
import { splitMath } from '../domain/math.mjs';

function MathMarkup({ tex, display }: { tex: string; display: boolean }): ReactNode {
  try {
    const html = katex.renderToString(tex, { displayMode: display, throwOnError: true, trust: false, strict: 'error' });
    return display
      ? <div className="math-display" role="img" aria-label={`Equation: ${tex}`} dangerouslySetInnerHTML={{ __html: html }} />
      : <span className="math-inline" role="img" aria-label={`Math: ${tex}`} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Invalid math source';
    return <span className="math-error" role="alert" title={detail}>Equation needs correction</span>;
  }
}

export function MathText({ text, className = '' }: { text: string; className?: string }) {
  return <span className={`math-text ${className}`.trim()}>{splitMath(text).map((part, index) => part.math !== undefined
    ? <MathMarkup key={`math-${index}`} tex={part.math} display={!!part.display} />
    : <span key={`text-${index}`} style={{ whiteSpace: 'pre-wrap' }}>{part.text}</span>)}</span>;
}

export function MathBlock({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`math-block ${className}`.trim()}>{splitMath(text).map((part, index) => part.math !== undefined
    ? <MathMarkup key={`math-${index}`} tex={part.math} display={true} />
    : <span key={`text-${index}`} style={{ whiteSpace: 'pre-wrap' }}>{part.text}</span>)}</div>;
}

export { splitMath };
