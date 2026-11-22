// Word-strobe motion: nothing eases, everything cuts. A word is either there or not; it cuts in on its own frame, after an uneven
// gap of a few frames (tokens.gaps, in frames), so a line arrives like a stutter of title cards. Fields (hard bars of paper) open in
// three hard steps. Behind the readable text a giant tonal word, bleeding off the frame, changes on the beat: the strobe. It is
// tonal on purpose (a step of grey on the dark ground), so the frame's brightness never pulses.
import { clamp, mix, contrast } from '/engine/kit.js';

export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const lightOf = (c) => contrast(c, '#000000');
  const [paper, ink] = lightOf(bg) >= lightOf(text) ? [bg, text] : [text, bg];
  const onAccent = contrast(accent, ink) >= contrast(accent, paper) ? ink : paper;
  return {
    paper, ink, accent, onAccent,
    ghost: mix(ink, paper, T.tone.ghost), ghostKey: mix(ink, accent, 0.26),
    wall: mix(ink, paper, T.tone.wall), wall2: mix(ink, paper, T.tone.wall2), edge: mix(ink, paper, T.tone.edge),
    struck: mix(paper, ink, T.tone.struck),
    mark: contrast(accent, ink) >= 3 ? accent : mix(accent, paper, 0.5),   // small accent marks on the dark ground stay visible
  };
}

// The moments n things cut in, from t0: uneven gaps in frames, with a longer hold before the key (index `key`), if any.
export function cuts(n, t0, T, key = -1) {
  const out = []; let t = t0;
  for (let i = 0; i < n; i++) { if (i) t += T.gaps[(i * 3 + n) % T.gaps.length] * T.frame + (i === key ? 4 * T.frame : 0); out.push(t); }
  return out;
}
// A field that opens in three hard steps over three frames: 0, 0.45, 0.8, 1.
export const opens = (t, t0, T) => (t < t0 ? 0 : t < t0 + T.frame ? 0.45 : t < t0 + 2 * T.frame ? 0.8 : 1);
// Leaving: rows drop out one by one, every second frame, from the last row up. -> how many rows (from the end) are gone.
export const gone = (t, d, n, T) => (t < d - (n + 1) * 2 * T.frame ? 0 : Math.min(n, Math.floor((t - (d - (n + 1) * 2 * T.frame)) / (2 * T.frame)) + 1));

export function keyRuns(kit, f, { x0, x1, y, align = 'start' }) {
  const rtl = kit.rtl, out = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left, run = null;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      if (w.key) { if (run) { run.x0 = Math.min(run.x0, wl); run.x1 = Math.max(run.x1, wl + w.width); } else run = { x0: wl, x1: wl + w.width, y: yy, row: r, first: index }; }
      else if (run) { out.push(run); run = null; }
      cur = rtl ? wl - f.space : wl + w.width + f.space; index++;
    }
    if (run) out.push(run);
  });
  return out;
}
// Where each row of a fitted text sits (start-aligned): -> [{ x0, x1, y }]
export function rowBoxes(kit, f, x0, x1, y) {
  return f.rows.map((row, r) => ({ x0: kit.rtl ? x1 - row.width : x0, x1: kit.rtl ? x1 : x0 + row.width, y: y + r * f.lead }));
}
// kit.fit with even rows: narrows the box while the row count and size hold, never splitting a key phrase across rows.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  const split = (g) => keyRuns(kit, g, { x0: 0, x1: o.maxW, y: 0 }).length, n = split(f);
  let best = f;
  for (let w = o.maxW - 20; w > o.maxW * 0.45; w -= 20) {
    const g = kit.fit(text, { ...o, maxW: w });
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    if (split(g) > n) continue;
    best = g;
  }
  return best;
}
// A paper field behind a row: runs from the frame's reading edge to just past the row's far end, opened by `p` (hard steps).
export function field(ctx, W, box, size, p, color, rtl) {
  if (p <= 0) return;
  const h = size * 1.32, far = rtl ? box.x0 - size * 0.36 : box.x1 + size * 0.36, w = (rtl ? W - far : far) * p;
  ctx.fillStyle = color; ctx.fillRect(rtl ? W - w : 0, box.y - h / 2, w, h);
}
export function block(ctx, run, f, color) {
  const h = f.size * 1.32, px = f.space * 0.4;
  ctx.fillStyle = color; ctx.fillRect(run.x0 - px, run.y - h / 2, run.x1 - run.x0 + px * 2, h);
}
// The strobe: the giant tonal word of the moment. words: fitted giants (one word each); which: index or -1; slot alternates high/low.
export function ghost(ctx, kit, W, giants, which, color) {
  if (which < 0 || !giants.length) return;
  const g = giants[which % giants.length], hi = which % 2 === 0, y = hi ? 470 : 1180, bleed = g.width * 0.16;
  const x1 = W + bleed, x0 = -bleed;
  const xs0 = hi === kit.rtl ? x1 - g.width : x0;                  // alternate the bleeding edge too
  kit.drawText(ctx, g, { x0: xs0, x1: xs0 + g.width, y, align: 'start', color, key: color, decor: true });
}
export function giantsOf(kit, text, T, family) {
  const words = text.replace(/\*/g, '').split(/\s+/).filter(Boolean).map((w) => w.replace(/[؟?!،,.:]+$/u, '')).filter(Boolean);
  return words.map((w) => kit.fit(w, { size: T.size.ghost, weight: 900, family, maxW: 4000, single: true, overflow: true, where: 'a strobe word' }));
}
export const clampP = clamp;
