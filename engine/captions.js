// captions.js · captions locked to a narration, word by word.
// Two halves, both pure (a frame depends only on t and the inputs):
//   groupWords(words, opts)   words [{w,s,e,key?,brk?}] in seconds  ->  { groups: [{ t0, t1, lines: [[{w,s,e,key}]] }] }
//   layoutGroup / captionState / paintCaptions   say where each word sits and how far it is spoken, and fill the words from that state.
// How captions LOOK belongs to the brand: no plate, shadow or highlight is drawn here. captionState gives raw values per word
// (`speaking` and `shown`, both 0..1) and a look's own part draws the words as it likes; paintCaptions is only the plain fill.
// groupWords is written twice on purpose: here for the browser, and in tools/captions.py for the command line. The two must give the
// same groups (tools/test_captions.py checks it on every fixture), so when you change a rule here, change it there in the same words.
// Nothing in this file imports the page or the brand loader, so Node can load it for the grouping test.

export const DEFAULTS = { maxChars: 24, maxLines: 2, pause: 0.35 };
const LEAD_IN = 0.06, TAIL = 0.4;        // a group shows from 0.06 s before its first word, and at most 0.4 s after its last

// ---------- text helpers (kept identical to tools/captions.py) ----------
const DIAC = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;      // Arabic marks and the tatweel stretch
export const norm = (w) => w.replace(DIAC, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^\p{L}\p{N}]/gu, '');
const textLen = (w) => w.replace(DIAC, '').length;                       // marks take no room, so they do not count
const trim = (w) => w.replace(/^[\s"“”«»()[\]]+|[\s.,،؟?!…؛;:"“”«»()[\]]+$/g, '');
const endsSentence = (w) => /[،,.؟?!…؛;:]$/.test(w.replace(/[\s"“”«»()[\]]+$/g, ''));
const isNumber = (w) => /^[0-9٠-٩۰-۹]+([.,٫٬][0-9٠-٩۰-۹]+)*$/.test(trim(w));
// Short words a line must never end on: they belong to the word after them.
const FUNC = new Set(['من', 'في', 'على', 'إلى', 'عن', 'مع', 'يا', 'ما', 'لا', 'هل', 'لو', 'إذا', 'بس', 'أو', 'و', 'ثم', 'حتى', 'كل', 'أي',
  'هذا', 'هذه', 'هاد', 'هاي', 'اللي', 'يلي', 'إنو', 'أن', 'إن', 'قد'].map(norm));
const glued = (w) => FUNC.has(norm(w)) || isNumber(w);                   // a function word or a number never ends a line

// ---------- grouping ----------
// Atoms are runs of words that may not be split: a function word or a number sticks to the word after it ("3 أشهر", "9.99 ريال").
function atomsOf(words) {
  const atoms = [];
  let cur = [];
  words.forEach((w, i) => { cur.push(w); if (i === words.length - 1 || !glued(w.w)) { atoms.push(cur); cur = []; } });
  return atoms;
}
const span = (atoms, i, j) => { let words = 0, chars = 0; for (let a = i; a < j; a++) for (const w of atoms[a]) { words++; chars += textLen(w.w); } return { words, len: chars + words - 1 }; };

// Best way to break one group's atoms into lines: balanced lengths, no line over the limit, no lone word on a line.
function splitLines(atoms, maxChars, maxLines, alone) {
  const n = atoms.length, total = span(atoms, 0, n).len;
  let best = null;
  for (let L = 1; L <= Math.min(maxLines, n); L++) {
    const ideal = total / L, memo = new Map();
    const lineCost = (i, j) => {
      const s = span(atoms, i, j);
      let c = (s.len - ideal) ** 2 + 1000 * Math.max(0, s.len - maxChars);
      if (s.words === 1 && !(n === 1 && alone)) c += 2000;
      return c;
    };
    const f = (i, k) => {
      if (k === 1) return { cost: lineCost(i, n), cuts: [] };
      const key = i * 100 + k;
      if (memo.has(key)) return memo.get(key);
      let b = null;
      for (let j = i + 1; j <= n - (k - 1); j++) {
        const r = f(j, k - 1), cost = lineCost(i, j) + r.cost;
        if (!b || cost < b.cost) b = { cost, cuts: [j, ...r.cuts] };
      }
      memo.set(key, b);
      return b;
    };
    const r = f(0, L), cost = r.cost + 25 * (L - 1);
    if (!best || cost < best.cost) best = { cost, cuts: r.cuts };
  }
  const lines = []; let from = 0;
  for (const c of [...best.cuts, n]) { lines.push(atoms.slice(from, c).flat()); from = c; }
  return { cost: best.cost, lines };
}

// A phrase (between pauses and sentence ends) becomes one group if it fits, else the cheapest set of balanced groups.
function groupPhrase(words, o) {
  const atoms = atomsOf(words), n = atoms.length, cap = o.maxChars * o.maxLines, alone = words.length === 1;
  const g = new Array(n + 1).fill(Infinity), from = new Array(n + 1).fill(0), made = new Array(n + 1).fill(null);
  g[0] = 0;
  for (let j = 1; j <= n; j++) {
    for (let i = j - 1; i >= 0; i--) {
      const len = span(atoms, i, j).len;
      if (len > cap && j - i > 1) break;                                  // longer spans only get longer
      const r = splitLines(atoms.slice(i, j), o.maxChars, o.maxLines, alone);
      const cost = g[i] + 40 + r.cost + 0.5 * Math.max(0, cap - len) ** 2;
      if (cost < g[j]) { g[j] = cost; from[j] = i; made[j] = r.lines; }
    }
  }
  const out = [];
  for (let j = n; j > 0; j = from[j]) out.unshift(made[j]);
  return out;
}

export function groupWords(input, opts = {}) {
  const o = { ...DEFAULTS, ...Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined)) };   // an unset option keeps its default
  const words = input.map((x) => ({ w: x.w, s: x.s, e: x.e, key: !!x.key, brk: !!x.brk })).filter((x) => x.w);
  const phrases = []; let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (!next || endsSentence(w.w) || next.s - w.e >= o.pause - 1e-9 || next.brk) { phrases.push(cur); cur = []; }
  });
  const groups = [];
  for (const p of phrases) for (const lines of groupPhrase(p, o)) {
    const clean = lines.map((l) => l.map(({ w, s, e, key }) => ({ w, s, e, key })));
    groups.push({ t0: Math.max(0, clean[0][0].s - LEAD_IN), t1: 0, lines: clean });
  }
  groups.forEach((g, i) => {                                               // a group never starts before the word before it is finished
    if (i) g.t0 = Math.min(g.lines[0][0].s, Math.max(g.t0, groups[i - 1].lines.at(-1).at(-1).e));
  });
  groups.forEach((g, i) => {
    const lastE = g.lines.at(-1).at(-1).e, next = groups[i + 1];
    g.t1 = Math.max(lastE, Math.min(next ? next.t0 : Infinity, lastE + TAIL));   // never cut a word short
  });
  return { groups };
}


// ---------- layout ----------
const smooth = (p) => { const q = Math.min(1, Math.max(0, p)); return q * q * (3 - 2 * q); };
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (a, b, p) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join(''); };
const fontOf = (family, weight, size) => `${weight} ${size}px "${family}"`;

// Puts a group's lines at explicit positions, one word at a time, so Arabic mixed with digits keeps its order.
// Coordinates are relative to the middle of the block. If the widest line is wider than maxWidth the size shrinks until it fits.
export function layoutGroup(ctx, group, { brand, size = 68, maxWidth = 940, family = brand.fonts.display.family, weight = 700 }) {
  const rtl = brand.dir === 'rtl';
  ctx.save(); ctx.direction = brand.dir; ctx.textBaseline = 'middle';
  let s = size, rows, space = 0;
  for (let pass = 0; pass < 6; pass++) {
    ctx.font = fontOf(family, weight, s);
    space = ctx.measureText(' ').width;
    rows = group.lines.map((line) => {
      const ws = line.map((w) => ({ ...w, width: ctx.measureText(w.w).width }));
      return { words: ws, width: ws.reduce((a, w) => a + w.width, 0) + space * (ws.length - 1) };
    });
    const widest = Math.max(...rows.map((r) => r.width));
    if (widest <= maxWidth) break;
    s = Math.floor(s * maxWidth / widest * 0.99);
  }
  ctx.restore();
  const lead = s * 1.4;
  rows.forEach((row, r) => {
    row.y = (r - (rows.length - 1) / 2) * lead;
    let x = rtl ? row.width / 2 : -row.width / 2;
    for (const w of row.words) { w.x0 = rtl ? x - w.width : x; w.x1 = w.x0 + w.width; x += (rtl ? -1 : 1) * (w.width + space); }
  });
  return { size: s, lead, width: Math.max(...rows.map((r) => r.width)), height: (rows.length - 1) * lead + s * 1.25, lines: rows };
}

// ---------- pages: what is on screen between two moments ----------
// hold, karaoke and plain show one group at a time. pop shows one or two words at a time, cut from the groups.
function popChunks(words) {
  const out = []; let i = 0;
  while (i < words.length) {
    const a = words[i], b = words[i + 1];
    const pair = b && (glued(a.w) || (textLen(a.w) <= 6 && textLen(b.w) <= 6 && b.s - a.e < 0.2));
    out.push(pair ? [a, b] : [a]); i += pair ? 2 : 1;
  }
  return out;
}

export function buildPages(captions, style = 'hold') {
  const pages = []; let n = 0, prevE = 0;
  for (const g of captions.groups) {
    const lines = g.lines.map((l) => l.map((w) => ({ ...w, i: n++ })));
    if (style !== 'pop') { pages.push({ start: g.t0, end: g.t1, lines, firstS: lines[0][0].s, lastE: lines.at(-1).at(-1).e }); continue; }
    const chunks = popChunks(lines.flat()), first = pages.length;
    chunks.forEach((c, k) => {
      const start = Math.max(0, c[0].s - 0.10, prevE);                    // never before the previous word is finished
      prevE = c.at(-1).e;
      pages.push({ start, end: g.t1, lines: [c], firstS: c[0].s, lastE: prevE, pop: true });
      if (k > 0) pages[first + k - 1].end = Math.max(pages[first + k - 1].lastE, start);
    });
  }
  return pages;
}

// Everything a frame needs, as plain data: the tests read it and a look draws from it.
// Per word, `speaking` (0..1 while the word is spoken, easing in and out) and `shown` (0..1, whether it has appeared) are raw values a look can use
// for its own highlight; `alpha`, `color` and `scale` are the older ready-made values of the four styles.
export function captionState(ctx, t, { W = 1080, brand, captions, style = 'hold', y = 1150, size = 68, margin = 70, pages = null, family = brand.fonts.display.family, weight = 700 }) {
  const list = pages || buildPages(captions, style);
  let page = null;
  for (const p of list) if (p.start <= t && t < p.end) page = p;          // the latest page that has started wins
  if (!page) return null;
  const c = brand.colors, pop = !!page.pop;
  const lay = layoutGroup(ctx, page, { brand, size: pop ? Math.round(size * 1.45) : size, maxWidth: W - 2 * margin, family, weight });
  // entering: ready by the first word's start; leaving: only after the last word is done
  const inRamp = Math.min(0.06, Math.max(0, page.firstS - page.start)), outRamp = Math.min(0.15, Math.max(0, page.end - page.lastE));
  let alpha = (inRamp > 0 ? smooth((t - page.start) / inRamp) : 1) * (outRamp > 0 ? 1 - smooth((t - (page.end - outRamp)) / outRamp) : 1);
  const words = [];
  for (const row of lay.lines) for (const w of row.words) {
    const speaking = smooth((t - w.s) / 0.06) * (1 - smooth((t - w.e) / 0.10));   // 1 while the word is spoken, easing in and out
    const shown = smooth((t - (w.s - 0.08)) / 0.08);                              // 0 before the word, 1 from its start on
    let a = alpha, color = c.text, scale = 1, dy = 0;
    if (style === 'hold' && !pop) {
      const d = Math.min(0.08, Math.max(0, w.s - page.start));            // each word is complete by its own start and then stays
      const k = d > 0 ? smooth((t - (w.s - d)) / d) : (t >= w.s ? 1 : 0);
      a *= k; dy = (1 - k) * 14;
    }
    if (style === 'karaoke' && !pop) color = mix(mix(c.text, c.bg, 0.55), c.text, smooth((t - w.s) / 0.06));
    if (style !== 'plain') color = mix(color, c.accent, speaking);
    if (w.key) color = c.accent;
    if (pop) { const d = Math.min(0.10, Math.max(0, page.firstS - page.start)), p = d > 0 ? smooth((t - page.start) / d) : 1; a *= p; scale = 0.88 + 0.12 * p; }
    words.push({ i: w.i, w: w.w, s: w.s, e: w.e, key: w.key, x: W / 2 + (w.x0 + w.x1) / 2, width: w.width, y: y + row.y + dy, alpha: a, color, scale, speaking, shown });
  }
  return { alpha, dir: brand.dir, family, weight, layout: lay, words, box: { x: W / 2 - lay.width / 2, y: y - lay.height / 2, w: lay.width, h: lay.height } };
}

// The plain fill of a state: each word at its place with its own alpha, colour and scale. No shadow, backing or other decoration:
// a brand that wants more draws the words itself from the state. Between captions the state is null and nothing is drawn.
export function paintCaptions(ctx, state, opts = {}) {
  if (!state) return;
  const { family = state.family, weight = state.weight ?? 700 } = opts;
  ctx.save();
  ctx.font = fontOf(family, weight, state.layout.size); ctx.direction = state.dir; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const w of state.words) {
    if (w.alpha <= 0) continue;
    ctx.save(); ctx.globalAlpha = w.alpha; ctx.fillStyle = w.color;
    ctx.translate(w.x, w.y); ctx.scale(w.scale, w.scale); ctx.fillText(w.w, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
