// bidi.js · splits one line of text into runs in visual order, so each run can be shaped on its own.
// HarfBuzz shapes one direction at a time and never reorders, so mixed text ("Tiraz طراز 2026") needs this step first.
// It is the core of the Unicode bidi algorithm (UAX #9, rules W1-W7, N1-N2, I1-I2, L2) for ONE line with ONE base direction.
// Limits: no embeddings, overrides or isolates (the invisible control characters are ignored), no line breaking, trailing spaces keep the level they resolve to.
// For the strings a reel uses (Arabic with Latin words, numbers and prices) it gives the same order as the browser.

const AL_EXTRA = new Set([0x640, 0x61B, 0x61C, 0x61F]);     // tatweel and Arabic punctuation count as Arabic letters
const reMark = /[\p{Mn}\p{Me}]/u, reLetter = /\p{L}/u, reArabic = /\p{Script=Arabic}|\p{Script=Syriac}|\p{Script=Thaana}|\p{Script=Nko}/u, reHebrew = /\p{Script=Hebrew}/u;
const reCurrency = /\p{Sc}/u, reSpace = /\s/u;

// The class of one character: L, R, AL (Arabic letter), EN, AN, ES, ET, CS, NSM, or ON (neutral, spaces included).
function classOf(ch) {
  const c = ch.codePointAt(0);
  if (c === 0x200E || c === 0x200F || c === 0x202A || c === 0x202B || c === 0x202C || c === 0x202D || c === 0x202E || (c >= 0x2066 && c <= 0x2069)) return 'BN';
  if (reMark.test(ch)) return 'NSM';
  if ((c >= 0x30 && c <= 0x39) || (c >= 0x6F0 && c <= 0x6F9)) return 'EN';
  if ((c >= 0x660 && c <= 0x669) || c === 0x66B || c === 0x66C) return 'AN';
  if (c === 0x2B || c === 0x2D) return 'ES';
  if (c === 0x23 || c === 0x25 || c === 0xB0 || c === 0x2030 || c === 0x66A || reCurrency.test(ch)) return 'ET';
  if (c === 0x2C || c === 0x2E || c === 0x2F || c === 0x3A || c === 0xA0 || c === 0x60C) return 'CS';
  if (AL_EXTRA.has(c)) return 'AL';
  if (reLetter.test(ch)) return reHebrew.test(ch) ? 'R' : reArabic.test(ch) ? 'AL' : 'L';
  return 'ON';
}

export const hasArabic = (s) => reArabic.test(s);

// Returns [{ start, end, level, rtl }] in visual order, left to right. start/end are UTF-16 indexes into `text`.
export function splitRuns(text, dir = 'rtl') {
  const n = text.length;
  if (!n) return [];
  const base = dir === 'rtl' ? 1 : 0, e = base ? 'R' : 'L';
  const t = new Array(n);
  for (let i = 0; i < n;) {                                           // one class per code point, copied to its second half if it is a surrogate pair
    const ch = String.fromCodePoint(text.codePointAt(i)), cls = classOf(ch);
    for (let k = 0; k < ch.length; k++) t[i + k] = cls;
    i += ch.length;
  }
  const keep = [];                                                    // invisible direction controls take no part
  for (let i = 0; i < n; i++) if (t[i] !== 'BN') keep.push(i);
  const T = keep.map((i) => t[i]), m = T.length;
  if (!m) return [{ start: 0, end: n, level: base, rtl: !!base }];

  for (let i = 0; i < m; i++) if (T[i] === 'NSM') T[i] = i ? T[i - 1] : e;                  // W1: a mark follows its base letter
  let last = e;
  for (let i = 0; i < m; i++) {                                                             // W2: digits after an Arabic letter are Arabic-Indic numbers
    if (T[i] === 'L' || T[i] === 'R' || T[i] === 'AL') last = T[i];
    else if (T[i] === 'EN' && last === 'AL') T[i] = 'AN';
  }
  for (let i = 0; i < m; i++) if (T[i] === 'AL') T[i] = 'R';                                // W3
  for (let i = 1; i < m - 1; i++) {                                                         // W4: one separator between two numbers joins them
    if (T[i] === 'ES' && T[i - 1] === 'EN' && T[i + 1] === 'EN') T[i] = 'EN';
    else if (T[i] === 'CS' && (T[i - 1] === 'EN' || T[i - 1] === 'AN') && T[i + 1] === T[i - 1]) T[i] = T[i - 1];
  }
  for (let i = 0; i < m; i++) {                                                             // W5: currency and percent signs next to a European number belong to it
    if (T[i] !== 'ET') continue;
    let j = i; while (j < m && T[j] === 'ET') j++;
    if ((i > 0 && T[i - 1] === 'EN') || (j < m && T[j] === 'EN')) for (let k = i; k < j; k++) T[k] = 'EN';
    i = j - 1;
  }
  for (let i = 0; i < m; i++) if (T[i] === 'ES' || T[i] === 'ET' || T[i] === 'CS') T[i] = 'ON';   // W6
  last = e;
  for (let i = 0; i < m; i++) {                                                             // W7: European numbers after a Latin letter are Latin
    if (T[i] === 'L' || T[i] === 'R') last = T[i];
    else if (T[i] === 'EN' && last === 'L') T[i] = 'L';
  }
  const strong = (c) => (c === 'L' ? 'L' : 'R');                                            // for N1, numbers count as right-to-left
  for (let i = 0; i < m; i++) {                                                             // N1, N2: a neutral run takes the direction of both neighbours, else the line's
    if (T[i] !== 'ON') continue;
    let j = i; while (j < m && T[j] === 'ON') j++;
    const before = i ? strong(T[i - 1]) : e, after = j < m ? strong(T[j]) : e, d = before === after ? before : e;
    for (let k = i; k < j; k++) T[k] = d;
    i = j - 1;
  }
  const lv = new Array(n).fill(base);                                                       // I1, I2
  keep.forEach((idx, k) => {
    const c = T[k];
    lv[idx] = base ? (c === 'R' ? 1 : 2) : (c === 'L' ? 0 : c === 'R' ? 1 : 2);
  });
  for (let i = 0; i < n; i++) if (t[i] === 'BN') lv[i] = i ? lv[i - 1] : base;               // controls ride with their neighbour

  let runs = [];
  for (let i = 0; i < n; i++) {
    if (runs.length && runs.at(-1).level === lv[i]) runs.at(-1).end = i + 1;
    else runs.push({ start: i, end: i + 1, level: lv[i] });
  }
  const max = Math.max(...runs.map((r) => r.level)), min = Math.min(...runs.map((r) => r.level)) | 1;   // L2: reverse from the deepest level up to the lowest odd one
  for (let lvl = max; lvl >= min; lvl--) {
    for (let i = 0; i < runs.length;) {
      if (runs[i].level < lvl) { i++; continue; }
      let j = i; while (j < runs.length && runs[j].level >= lvl) j++;
      runs = [...runs.slice(0, i), ...runs.slice(i, j).reverse(), ...runs.slice(j)];
      i = j;
    }
  }
  return runs.map((r) => ({ ...r, rtl: r.level % 2 === 1 }));
}
