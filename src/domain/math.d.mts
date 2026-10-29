export interface MathPart {
  text: string;
  math?: string;
  display?: boolean;
}
export function splitMath(input: string): MathPart[];
