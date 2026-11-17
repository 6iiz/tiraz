// effects.js · pure drawing helpers for text shaped by shape.js. Each takes the shaped text, a position, colours and a progress p (0..1) and draws one frame.
// Nothing is remembered between frames: the only caches (Path2D objects, flubber interpolators) are memos that give the same answer every time.
//   (x, y) is the left end of the baseline, or the middle / right end when options.align is 'center' / 'right'.
//   options: { fill, align, alpha, ... } plus the ones named at each helper. Colours are any canvas colour string.
// Arabic is revealed by whole words (revealWords) or, on purpose, glyph by glyph (revealGlyphs): glyphs never move apart, so joins stay closed.
import { contours, shiftPath } from './path.js';

export const smooth = (p) => { const q = Math.min(1, Math.max(0, p)); return q * q * (3 - 2 * q); };
const clamp = (v) => Math.min(1, Math.max(0, v));
const anchor = (s, x, align) => x - s.width * (align === 'center' ? 0.5 : align === 'right' ? 1 : 0);

const glyphPaths = new WeakMap();      // glyph -> { path, parts: [{ path, len }] } in the glyph's own coordinates
function parts(g) {
  let c = glyphPaths.get(g);
  if (!c) { c = { path: new Path2D(g.d), parts: contours(g.d).map((k) => ({ path: new Path2D(k.d), len: k.len })) }; glyphPaths.set(g, c); }
  return c;
}
// One Path2D holding the glyphs with these indexes, each moved to its place in the line.
function pathOf(s, ids) {
  const out = new Path2D();
  for (const i of ids) { const g = s.glyphs[i]; out.addPath(parts(g).path, new DOMMatrix().translate(g.x, g.y)); }
  return out;
}
const all = (s) => s.glyphs.map((_, i) => i);
const place = (ctx, s, x, y, o) => { ctx.translate(anchor(s, x, o.align), y); ctx.globalAlpha *= o.alpha ?? 1; };

// The whole text at once.
export function fillText(ctx, s, x, y, o = {}) {
  ctx.save(); place(ctx, s, x, y, o);
  ctx.fillStyle = o.fill ?? '#fff'; ctx.fill(pathOf(s, all(s)));
  ctx.restore();
}

// Variable fonts draw a letter as several overlapping shapes, so a plain stroke also draws lines INSIDE the letter where the shapes cross.
// The line is therefore drawn on a scratch canvas and everything deeper inside the letter than the line's half width is erased: only the real outline stays.
const scratch = [null, null, null];
function canvasOf(i, w, h) {
  const c = scratch[i] ??= document.createElement('canvas');
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h);
  return g;
}
const boxes = new WeakMap();
function bounds(s) {                                                   // the ink box of the whole line, marks included
  let b = boxes.get(s);
  if (!b) {
    b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const g of s.glyphs) for (const c of contours(g.d)) { b[0] = Math.min(b[0], g.x + c.box[0]); b[1] = Math.min(b[1], g.y + c.box[1]); b[2] = Math.max(b[2], g.x + c.box[2]); b[3] = Math.max(b[3], g.y + c.box[3]); }
    if (b[0] === Infinity) b = [0, 0, 1, 1];
    boxes.set(s, b);
  }
  return b;
}

// The outline is drawn as a line that travels along the letters in reading order (right to left for Arabic), then the fill comes in.
// options.trace: share of p spent tracing (default 0.7), options.lineWidth: pixels (default 1.4 % of the size), options.stroke: line colour (default the fill).
export function drawOn(ctx, s, x, y, p, o = {}) {
  p = clamp(p); if (p <= 0) return;
  const trace = o.trace ?? 0.7, lw = o.lineWidth ?? Math.max(1.5, s.size * 0.014);
  const lens = s.reading.map((i) => parts(s.glyphs[i]).parts.reduce((t, k) => t + k.len, 0)), total = lens.reduce((t, v) => t + v, 0) || 1;
  const reach = clamp(p / trace) * total, fillA = smooth((p - trace) / (1 - trace));
  ctx.save(); place(ctx, s, x, y, o);
  const base = ctx.globalAlpha;
  if (fillA > 0) { ctx.globalAlpha = base * fillA; ctx.fillStyle = o.fill ?? '#fff'; ctx.fill(pathOf(s, all(s))); }
  if (fillA >= 1) { ctx.restore(); return; }                          // the line has given way to the fill: this frame is exactly fillText

  const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b) || 1, pad = Math.ceil(lw * 2 + 2), [x0, y0, x1, y1] = bounds(s);
  const w = Math.ceil((x1 - x0 + pad * 2) * sc), h = Math.ceil((y1 - y0 + pad * 2) * sc);
  const S = canvasOf(0, w, h), E = canvasOf(1, w, h), to = [sc, 0, 0, sc, (pad - x0) * sc, (pad - y0) * sc];
  S.setTransform(...to); S.strokeStyle = o.stroke ?? o.fill ?? '#fff'; S.lineWidth = lw; S.lineJoin = 'round'; S.lineCap = 'round';
  let start = 0;
  s.reading.forEach((gi, k) => {
    const f = clamp((reach - start) / (lens[k] || 1)); start += lens[k];
    if (f <= 0) return;
    const g = s.glyphs[gi];
    S.save(); S.translate(g.x, g.y);
    for (const c of parts(g).parts) { S.setLineDash(f >= 1 ? [] : [c.len * f, c.len * 2]); S.stroke(c.path); }   // every contour of the glyph grows together
    S.restore();
  });
  // E = the letters shrunk by half the line width: the intersection of the letters moved a little in 16 directions. (Stroking the outline would also cut away
  // the places where the overlapping shapes meet, which is exactly what has to be erased.)
  const union = pathOf(s, all(s)), r = lw * 0.6 + 0.75 / sc;
  E.setTransform(...to);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    E.globalCompositeOperation = i ? 'destination-in' : 'source-over';
    E.save(); E.translate(Math.cos(a) * r, Math.sin(a) * r); E.fill(union); E.restore();
  }
  S.setTransform(1, 0, 0, 1, 0, 0); S.globalCompositeOperation = 'destination-out'; S.drawImage(E.canvas, 0, 0);
  ctx.globalAlpha = base * (1 - fillA);
  ctx.drawImage(S.canvas, x0 - pad, y0 - pad, w / sc, h / sc);
  ctx.restore();
}

// Staggered windows: item i of n starts at i/n of the way and takes `width` of p; returns each item's local progress.
const windows = (n, p, width) => Array.from({ length: n }, (_, i) => clamp((clamp(p) - (n > 1 ? i / (n - 1) : 0) * (1 - width)) / width));

// Whole words appear one after another in reading order, each rising a little while it fades in (a word moves as one piece, so its joins never open).
// options.rise: how far a word travels, in sizes (default 0.18); options.spread: how long each word takes, as a share of p (default 0.4).
export function revealWords(ctx, s, x, y, p, o = {}) {
  p = clamp(p); if (p <= 0) return;
  const q = windows(s.words.length, p, o.spread ?? 0.4), rise = (o.rise ?? 0.18) * s.size;
  ctx.save(); place(ctx, s, x, y, o); ctx.fillStyle = o.fill ?? '#fff';
  const done = [], base = ctx.globalAlpha;
  s.words.forEach((w, i) => {
    if (q[i] >= 1) { done.push(...w.ids); return; }
    if (q[i] <= 0) return;
    const e = smooth(q[i]);
    ctx.save(); ctx.globalAlpha = base * e; ctx.translate(0, rise * (1 - e)); ctx.fill(pathOf(s, w.ids)); ctx.restore();
  });
  if (done.length) ctx.fill(pathOf(s, done));                         // finished words in one fill
  ctx.restore();
}

// Glyphs fade in one after another in reading order and never move, so the joins between letters stay closed.
// options.spread: how long each glyph takes, as a share of p (default 0.3).
export function revealGlyphs(ctx, s, x, y, p, o = {}) {
  p = clamp(p); if (p <= 0) return;
  const q = windows(s.reading.length, p, o.spread ?? 0.3);
  ctx.save(); place(ctx, s, x, y, o); ctx.fillStyle = o.fill ?? '#fff';
  const done = [], base = ctx.globalAlpha;
  s.reading.forEach((gi, k) => {
    if (q[k] >= 1) { done.push(gi); return; }
    if (q[k] <= 0) return;
    ctx.globalAlpha = base * smooth(q[k]); ctx.fill(pathOf(s, [gi]));
  });
  ctx.globalAlpha = base; if (done.length) ctx.fill(pathOf(s, done));
  ctx.restore();
}

// ---- morph -----------------------------------------------------------------------------------------------------------------------------------
// One string flows into another: their contours are paired and flubber moves each pair. Needs `await loadMorph()` once (in a scene's init).
let flubber = null;
export async function loadMorph() {
  if (flubber || globalThis.flubber) { flubber = globalThis.flubber; return; }
  await new Promise((ok, no) => {
    const el = document.createElement('script');
    el.src = new URL('../../vendor/flubber/flubber.min.js', import.meta.url).href;   // classic UMD file: sets window.flubber
    el.onload = ok; el.onerror = () => no(new Error('vendor/flubber/flubber.min.js did not load; the kit folder is incomplete.'));
    document.head.append(el);
  });
  flubber = globalThis.flubber;
}

const memo = new WeakMap();   // a -> Map(b + align -> interpolators)
function lineContours(s, align) {
  const dx = -s.width * (align === 'center' ? 0.5 : align === 'right' ? 1 : 0), out = [];
  for (const g of s.glyphs) for (const c of contours(shiftPath(g.d, g.x + dx, g.y))) out.push(c);
  return out;
}
// Pairs contours: holes with holes, outer shapes with outer shapes, left to right. Leftovers shrink to, or grow from, a dot at their own centre.
// Returns [{ a, b, hole }] with a or b missing for a leftover. Outer and hole are told apart by the sign of the contour's area.
function pairUp(A, B) {
  const sign = (L) => Math.sign(L.reduce((m, c) => (Math.abs(c.area) > Math.abs(m) ? c.area : m), 0)) || 1;
  const sa = sign(A), sb = sign(B), out = [];
  for (const hole of [false, true]) {
    const a = A.filter((c) => (Math.sign(c.area) === sa) !== hole).sort((p, q) => p.cx - q.cx);
    const b = B.filter((c) => (Math.sign(c.area) === sb) !== hole).sort((p, q) => p.cx - q.cx);
    const aSmall = a.length <= b.length, small = aSmall ? a : b, big = aSmall ? b : a, used = new Set();
    small.forEach((c, i) => {
      const j = small.length === 1 ? big.indexOf(big.reduce((m, k) => (Math.abs(k.area) > Math.abs(m.area) ? k : m), big[0])) : Math.round(i * (big.length - 1) / (small.length - 1));
      used.add(j); out.push(aSmall ? { a: c, b: big[j], hole } : { a: big[j], b: c, hole });
    });
    big.forEach((c, j) => { if (!used.has(j)) out.push(aSmall ? { b: c, hole } : { a: c, hole }); });
  }
  return out;
}
function build(a, b, align) {
  if (!flubber) throw new Error('morph needs the flubber library: call  await loadMorph()  once, in init.');
  const A = lineContours(a, align), B = lineContours(b, align), seg = { maxSegmentLength: Math.max(2, Math.min(a.size, b.size) / 36) };
  const fns = pairUp(A, B).map(({ a: ca, b: cb, hole }) => ({
    hole, f: ca && cb ? flubber.interpolate(ca.d, cb.d, seg) : ca ? flubber.toCircle(ca.d, ca.cx, ca.cy, 1, seg) : flubber.fromCircle(cb.cx, cb.cy, 1, cb.d, seg),
  }));
  const all = [...A, ...B], box = [Math.min(...all.map((c) => c.box[0])), Math.min(...all.map((c) => c.box[1])), Math.max(...all.map((c) => c.box[2])), Math.max(...all.map((c) => c.box[3]))];
  return { fns, box };
}
// Build the interpolators ahead of time (a scene may call this in init so the first morph frame costs nothing extra).
export function prepareMorph(a, b, o = {}) {
  const key = (o.align ?? 'left'); let m = memo.get(a); if (!m) memo.set(a, m = new Map());
  if (!m.has(b)) m.set(b, new Map());
  const by = m.get(b); if (!by.has(key)) by.set(key, build(a, b, key));
  return by.get(key);
}

// Draws the shape between text a (p = 0) and text b (p = 1). flubber turns every contour into a clockwise polygon, so holes are told apart beforehand:
// the outer shapes are filled together (overlaps simply merge) and the holes are cut out of them on a scratch canvas.
export function morph(ctx, a, b, x, y, p, o = {}) {
  p = clamp(p);
  if (p <= 0) return fillText(ctx, a, x, y, o);
  if (p >= 1) return fillText(ctx, b, x, y, o);
  const { fns, box } = prepareMorph(a, b, o);
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= o.alpha ?? 1;
  const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b) || 1, pad = 8, w = Math.ceil((box[2] - box[0] + pad * 2) * sc), h = Math.ceil((box[3] - box[1] + pad * 2) * sc);
  const S = canvasOf(2, w, h), paths = fns.map((q) => ({ hole: q.hole, path: new Path2D(q.f(p)) }));
  S.setTransform(sc, 0, 0, sc, (pad - box[0]) * sc, (pad - box[1]) * sc); S.fillStyle = o.fill ?? '#fff';
  for (const q of paths) if (!q.hole) S.fill(q.path);
  S.globalCompositeOperation = 'destination-out';
  for (const q of paths) if (q.hole) S.fill(q.path);
  ctx.drawImage(S.canvas, box[0] - pad, box[1] - pad, w / sc, h / sc);
  ctx.restore();
}
