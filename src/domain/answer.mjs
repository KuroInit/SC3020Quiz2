const normalizeText = value => String(value ?? '').trim().toLowerCase().replace(/[\s,;:]+/g, ' ').replace(/[.!?]+$/g, '');

function asNumber(value) {
  const cleaned = String(value ?? '').trim().replace(/,/g, '').replace(/\s*(?:i\/os?|pages?|tuples?)\s*$/i, '');
  if (!cleaned) return NaN;
  return Number(cleaned);
}

function matches(expected, actual, tolerance = 0) {
  if (typeof expected === 'number') {
    const n = asNumber(actual);
    return Number.isFinite(n) && Math.abs(n - expected) <= tolerance;
  }
  return normalizeText(actual) === normalizeText(expected);
}

export function validateAnswer({ type, value, expected, tolerance = 0 }) {
  if (type === 'numeric') {
    const number = asNumber(value);
    const correct = Number.isFinite(number) && Math.abs(number - Number(expected)) <= tolerance;
    return { correct, correctFields: correct ? 1 : 0, totalFields: 1 };
  }
  if (type === 'choice' || type === 'text') {
    const correct = matches(expected, value, tolerance);
    return { correct, correctFields: correct ? 1 : 0, totalFields: 1 };
  }
  if (type === 'parts') {
    const keys = Object.keys(expected || {});
    const correctFields = keys.filter(key => matches(expected[key], value?.[key], tolerance)).length;
    return { correct: keys.length > 0 && correctFields === keys.length, correctFields, totalFields: keys.length };
  }
  return { correct: false, correctFields: 0, totalFields: 0, error: `Unsupported answer type: ${type}` };
}
