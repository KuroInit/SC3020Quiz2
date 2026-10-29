import type { CourseModule, CourseQuestion } from '../domain/types';

export const sourceMap: Record<string, { title: string; note: string; tags: string[]; topics: string[] }>;
export const modules: CourseModule[];
export const allQuestions: CourseQuestion[];
