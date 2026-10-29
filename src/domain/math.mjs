const slash = String.fromCharCode(92);
const delimiters = [
  { open: '$$', close: '$$', display: true },
  { open: `${slash}[`, close: `${slash}]`, display: true },
  { open: `${slash}(`, close: `${slash})`, display: false },
  { open: '$', close: '$', display: false }
];

/** Split text into plain text and math without losing TeX command backslashes. */
export function splitMath(input) {
  const text = String(input ?? '');
  const parts = [];
  let cursor = 0;

  while (cursor < text.length) {
    let selected = null;
    for (const delimiter of delimiters) {
      let openAt = text.indexOf(delimiter.open, cursor);
      if (delimiter.open === '$') {
        while (openAt >= 0 && (text[openAt - 1] === '$' || text[openAt + 1] === '$')) {
          openAt = text.indexOf('$', openAt + 1);
        }
      }
      if (openAt >= 0 && (!selected || openAt < selected.openAt)) {
        selected = { ...delimiter, openAt };
      }
    }

    if (!selected) {
      const remainder = text.slice(cursor);
      if (remainder) parts.push({ text: remainder });
      break;
    }

    if (selected.openAt > cursor) parts.push({ text: text.slice(cursor, selected.openAt) });
    let closeAt = text.indexOf(selected.close, selected.openAt + selected.open.length);
    if (selected.close === '$') {
      while (closeAt >= 0 && (text[closeAt - 1] === '$' || text[closeAt + 1] === '$')) {
        closeAt = text.indexOf('$', closeAt + 1);
      }
    }
    if (closeAt < 0) {
      parts.push({ text: text.slice(selected.openAt) });
      break;
    }

    const math = text.slice(selected.openAt + selected.open.length, closeAt).trim();
    if (math) parts.push({ text: '', math, display: selected.display });
    else parts.push({ text: text.slice(selected.openAt, closeAt + selected.close.length) });
    cursor = closeAt + selected.close.length;
  }

  return parts;
}
