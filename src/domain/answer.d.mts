import type { AnswerValue } from './types';

export function validateAnswer(input: { type: string; value: AnswerValue | string; expected: AnswerValue; tolerance?: number }): { correct: boolean; correctFields: number; totalFields: number; error?: string };
