export type QuestionType = 'choice' | 'numeric' | 'parts' | 'text';
export type Provenance = 'official' | 'derived';
export type AnswerValue = string | number | Record<string, string | number>;

export interface ReviewCopy {
  correct: string;
  incorrect: string;
  firstDivergence: string;
  nextStep: string;
}

export interface AnswerField {
  label: string;
  placeholder: string;
}

export interface CourseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  expected: AnswerValue;
  answerFormat: {
    label: string;
    hint: string;
    fields?: Record<string, AnswerField>;
  };
  hint: string;
  explanation: string[];
  source: string;
  provenance: Provenance;
  answerTolerance?: number;
  review: ReviewCopy;
}

export interface CourseLesson {
  id: string;
  title: string;
  concept: string;
  equation: string;
  meaning: string;
  symbols: [string, string][];
  steps: string[];
  example: string;
  diagram: string;
  source: string;
}

export interface CourseModule {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  weeks: string;
  chapter: string;
  description: string;
  outcomes: string[];
  lessons: CourseLesson[];
  checkpoint: CourseQuestion[];
  transfers: CourseQuestion[];
}

export interface AttemptRecord {
  questionId: string;
  moduleId: string;
  mode: 'checkpoint' | 'transfer' | 'practice' | 'mixed';
  correct: boolean;
  correctFields: number;
  totalFields: number;
  hintUsed: boolean;
  response: AnswerValue;
  createdAt: string;
}
