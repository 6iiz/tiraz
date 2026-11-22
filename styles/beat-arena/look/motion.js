// Beat-arena motion: a rhythm game on a stage set. Every card, word and sticker pops in on the beat with a small toy squash (a short
// over-swing of about 6% that dies inside the pop), stickers stamp with a burst of ink speed-lines, and things leave by shrinking
// back into a point, faster than they came. Shapes are flat, outlined in ink, with a hard ink shadow offset down and to the side.
import { clamp, mix, contrast } from '/engine/kit.js';

// The brand's colours as the set uses them: paper is the lighter of bg/text, ink the darker; the accent is the stage colour.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lightOf = (c) => contrast(c, '#000000');
  const [paper, ink] = lightOf(bg) >= lightOf(text) ? [bg, text] : [text, bg];
  const onAccent = contrast(accent, ink) >= contrast(accent, paper) ? ink : paper;
  const accentLight = onAccent === ink;                          // a light accent gets darker stripes, a dark one lighter stripes
  return {
    paper, ink, accent, onAccent,
    stripe: mix(accent, accentLight ? ink : paper, T.tone.stripe),
    floor: mix(accent, ink, T.tone.floor),
    dim: mix(ink, paper, T.tone.dim),
    answer: mix(accent, paper, 0.55),
  };
}

// A pop: 0 before, grows past 1 by a hair and settles exactly on 1 at p = 1.
export const pop = (p) => { p = clamp(p); if (p <= 0) return 0; if (p >= 1) return 1; return (1 - (1 - p) ** 3) * (1 + 0.12 * Math.sin(Math.PI * p)); };
// Leaving: shrinks to nothing with an accelerating curve.
export const shrink = (p) => 1 - clamp(p) ** 2.4;
export const ease = (p) => 1 - (1 - clamp(p)) ** 3;

// Scale everything drawn after this call around (cx, cy).
export function around(ctx, cx, cy, sx, sy = sx) { ctx.translate(cx, cy); ctx.scale(sx, sy); ctx.translate(-cx, -cy); }

// A flat card: hard ink shadow, fill, ink outline. r = corner radius.
export function card(ctx, x, y, w, h, fill, ink, T, { r = T.radius, stroke = T.stroke, shadow = T.shadow } = {}) {
  ctx.fillStyle = ink; ctx.beginPath(); ctx.roundRect(x + shadow * 0.6, y + shadow, w, h, r); ctx.fill();
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.lineWidth = stroke; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.stroke();
}

// A burst of speed-lines around a box when a sticker stamps: lines shoot out and are gone by p = 1.
export function burst(ctx, cx, cy, rx, ry, p, ink, n = 12) {
  if (p <= 0 || p >= 1) return;
  const a = ease(p), b = clamp(p * 1.6 - 0.6);
  ctx.save(); ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineWidth = 7;
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + 0.2, c = Math.cos(th), s = Math.sin(th);
    const from = 26 + 70 * b, to = 30 + 70 * a;                  // the head runs out, the tail follows and catches it
    if (to - from < 1) continue;
    ctx.beginPath(); ctx.moveTo(cx + c * (rx + from), cy + s * (ry + from)); ctx.lineTo(cx + c * (rx + to), cy + s * (ry + to)); ctx.stroke();
  }
  ctx.restore();
}

// Where the runs of key words of a fitted text sit, so a multi-word *key phrase* gets one sticker, not one per word.
// Mirrors kit.drawText's placement. -> [{ x0, x1, y, row, first }]
export function keyRuns(kit, f, { x0, x1, y, align = 'start' }) {
  const rtl = kit.rtl, out = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left, run = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (run) { run.x0 = Math.min(run.x0, wl); run.x1 = Math.max(run.x1, wl + w.width); run.last = index; } else run = { x0: wl, x1: wl + w.width, y: yy, row: r, first: index, last: index }; }
      else if (run) { out.push(run); run = null; }
      cur = rtl ? wl - f.space : wl + w.width + f.space; index++;
    }
    if (run) out.push(run);
  });
  return out;
}

// The key sticker: an accent pill, outlined, with its own small hard shadow, stamped in with a pop.
export function sticker(ctx, run, f, pal, T, s) {
  if (s <= 0) return;
  const size = f.size, px = Math.min(size * 0.2, f.space * 0.38 + 8), h = size * 1.36, x = run.x0 - px, w = run.x1 - run.x0 + px * 2, y = run.y - h / 2 + size * 0.03;
  ctx.save(); around(ctx, x + w / 2, run.y, s);
  card(ctx, x, y, w, h, pal.accent, pal.ink, T, { r: h * 0.3, stroke: 6, shadow: 8 });
  ctx.restore();
}

// A nod on the first beat of every bar (4 beats), after `from`: a 5% swell that dies in a tenth of a second. Keeps a held sticker alive.
export function nod(t, from, beat) {
  if (t < from) return 1;
  const bar = beat * 4, u = ((t % bar) + bar) % bar;
  return 1 + 0.05 * Math.max(0, 1 - u / 0.12);
}
// The ink banner a lead-in or a title sits on: a solid ink tab with an accent rule along its foot.
export function ribbon(ctx, x, y, w, h, pal) {
  ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill();
}

// kit.fit, then rows of even length: when a text wraps, the box is narrowed as far as it goes without adding a row or shrinking the
// type, so a long line never leaves one word alone on its last row.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  const split = (g) => keyRuns(kit, g, { x0: 0, x1: o.maxW, y: 0 }).length;
  const n = split(f);
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) {
    const g = kit.fit(text, { ...o, maxW: w });
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    if (split(g) > n) continue;                                    // a key phrase is never cut in two by the wrap
    best = g;
  }
  return best;
}

// Breathing room around a sticker: the words of a key run move GAP along the reading direction and the words after it 2 × GAP, so the
// sticker's outline never touches its neighbours. -> dx for word i (and for a run, call with its first index).
export const GAP = 12;
export function nudge(runs, i, rtl) {
  let off = 0;
  for (const r of runs) { if (i > r.last && runOnRow(r, i)) off += 2 * GAP; else if (i >= r.first && i <= r.last) off += GAP; }
  return rtl ? -off : off;
}
const runOnRow = (r, i) => i <= r.rowEnd;
// keyRuns + the last word index of each run's row, so nudge only moves words on the same row.
export function keyRunsRows(kit, f, o) {
  const runs = keyRuns(kit, f, o); let idx = 0; const ends = f.rows.map((row) => (idx += row.words.length) - 1);
  for (const r of runs) r.rowEnd = ends[r.row];
  return runs;
}
