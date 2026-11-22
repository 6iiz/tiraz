// Wet brush motion: a page that paints itself. A broad brush crosses the paper in the reading direction laying a transparent wash, and
// the words under it develop as the brush passes: they appear in the wet colour of the pigment and dry to ink. Pigment is always glazed
// (multiplied) on the paper, so overlaps darken as real watercolour does. Nothing slides; what leaves is lifted off by a wash of clean
// paper. This file holds the palette, the wash and band sprites, the reveal of a band, and the develop step for words.
import { clamp, mix, rgba, contrast, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const I = (p) => clamp(p) ** 2.2;
export const BR = (p) => { p = clamp(p); return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2; };   // a brush crossing: eases in and out

const lum = (c) => contrast(c, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(bg) >= lum(text) ? bg : text, ink = paper === bg ? text : bg;
  const tint = (k) => mix(paper, accent, k), grey = (k) => mix(paper, ink, k);
  const on = (fill) => (contrast(fill, ink) >= contrast(fill, paper) ? ink : paper);
  // the strongest tint of the pigment, up to k, that ink still reads on at 4.5:1 (or paper, for a dark pigment)
  const strong = (k) => { let c = tint(k); while (k > 0.2 && Math.max(contrast(c, ink), contrast(c, paper)) < 4.5) { k -= 0.04; c = tint(k); } return c; };
  const quiet = (k) => { let c = grey(k); while (k < 1 && contrast(c, paper) < 4.5) { k += 0.04; c = grey(Math.min(1, k)); } return c; };
  return { paper, ink, accent, tint, grey, on, strong, quiet, wet: mix(accent, ink, 0.25), rgba };
}

const noise = (seed, n = 40) => { const r = rng(seed), v = Array.from({ length: n + 1 }, () => r()); return (s) => { const x = clamp(s) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i, u = f * f * (3 - 2 * f); return v[i] + (v[i + 1] - v[i]) * u; }; };

// A wash sprite: a soft-edged shape glazed in three passes whose edges disagree (so the rim pools darker), a thin pigment rim,
// and a little granulation. shape(r) returns the outline as points in the sprite's own pixels. Built once.
function glaze(cw, ch, outline, color, alpha, seed, { rim = 0.28, grain = 220 } = {}) {
  const cv = document.createElement('canvas'); cv.width = Math.ceil(cw); cv.height = Math.ceil(ch);
  const g = cv.getContext('2d'), r = rng(seed);
  for (let pass = 0; pass < 3; pass++) {
    const pts = outline(r, pass); g.fillStyle = rgba(color, alpha / 2.2);
    g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill();
    if (pass === 2) { g.strokeStyle = rgba(color, rim); g.lineWidth = 2.2; g.lineJoin = 'round'; g.stroke(); }
  }
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < grain; i++) { g.fillStyle = rgba(color, 0.12 + r() * 0.22); g.beginPath(); g.arc(r() * cw, r() * ch, 0.6 + r() * 1.8, 0, 7); g.fill(); }
  return cv;
}

// A horizontal brush band, w x h, its ends ragged and its tail (the far end in reading order) breaking into dry streaks.
export function band(w, h, color, alpha, seed, rtl = true) {
  const pad = 30, n1 = noise(seed, 60), n2 = noise(seed + 3, 60), n3 = noise(seed + 9, 6);
  const outline = (r, pass) => {
    const pts = [], N = 90, jit = () => (r() - 0.5) * 4, th = h * 0.46;
    const end = (s) => Math.pow(Math.min(1, s / 0.05, (1 - s) / 0.08), 0.45);           // round, wet ends
    const mid = (s) => pad + h / 2 + h * 0.07 * (n3(s) - 0.5) * 2 + (s - 0.5) * h * 0.08;
    for (let i = 0; i <= N; i++) { const s = i / N; pts.push([pad + s * w + jit(), mid(s) - th * (0.78 + 0.3 * n1(s)) * end(s) + jit() + pass * 1.5]); }
    for (let i = N; i >= 0; i--) { const s = i / N; pts.push([pad + s * w + jit(), mid(s) + th * (0.78 + 0.3 * n2(s)) * end(s) + jit() - pass * 1.5]); }
    return pts;
  };
  const cv = glaze(w + pad * 2, h + pad * 2, outline, color, alpha, seed, { grain: Math.round(w * h / 400) });
  // the dry tail: streaks of paper cut into the last fifth, along the stroke
  const g = cv.getContext('2d'), r = rng(seed + 17); g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const y = pad + h * (0.15 + 0.7 * r()), len = w * (0.06 + r() * 0.18), x = rtl ? pad + r() * w * 0.12 : pad + w - r() * w * 0.12 - len;
    g.lineWidth = 1 + r() * 3; g.strokeStyle = `rgba(0,0,0,${0.5 + r() * 0.5})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (r() - 0.5) * 4); g.stroke();
  }
  return { cv, pad, w, h };
}
// A round bloom of pigment, radius R, with a darker, uneven rim (a backrun).
export function bloomSprite(R, color, alpha, seed) {
  const pad = 30, nz = noise(seed, 24);
  const outline = (r, pass) => { const pts = []; for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2, rr = R * (0.9 + 0.12 * nz(i / 90)) + (r() - 0.5) * 6 - pass * 2; pts.push([pad + R + Math.cos(a) * rr, pad + R + Math.sin(a) * rr]); } return pts; };
  const cv = glaze(R * 2 + pad * 2, R * 2 + pad * 2, outline, color, alpha, seed, { rim: 0.35, grain: Math.round(R * R / 90) });
  // wet-in-wet: a lighter centre where the water pushed the pigment out
  const g = cv.getContext('2d'); g.globalCompositeOperation = 'destination-out';
  const gr = g.createRadialGradient(pad + R * 0.85, pad + R * 0.8, 0, pad + R, pad + R, R); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(0.7, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
  return { cv, pad, R };
}

// Lays a band sprite at (x, yMid) up to p of its length, from the reading side, with a wavy wet front. Glazed (multiplied).
export function lay(ctx, B, x, yMid, p, rtl = true, alpha = 1, mode = 'multiply') {
  p = clamp(p); if (p <= 0 || alpha <= 0) return;
  const W = B.w + B.pad * 2, Hh = B.h + B.pad * 2, x0 = x - B.pad, y0 = yMid - Hh / 2, front = rtl ? x0 + W - p * W : x0 + p * W;
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha *= alpha;
  if (p < 1) {
    ctx.beginPath();
    const far = rtl ? x0 + W + 2 : x0 - 2; ctx.moveTo(far, y0);
    for (let k = 0; k <= 12; k++) { const y = y0 + (k / 12) * Hh, wob = Math.sin(k * 1.7 + p * 9) * 7; ctx.lineTo(front + wob, y); }
    ctx.lineTo(far, y0 + Hh); ctx.closePath(); ctx.clip();
  }
  ctx.drawImage(B.cv, x0, y0);
  ctx.restore();
}
// The x of a band's wet front at p, for a band laid from x over its width w.
export const frontX = (x, w, p, rtl = true) => (rtl ? x + w - clamp(p) * w : x + clamp(p) * w);

// A word develops: it is not there until the brush front reaches it, then it shows in the wet pigment colour and dries to `ink`.
// q: 0..1 since the front reached it; out: 0..1 lifting away. Returns false or a colour for kit.drawText's `each`.
export function develop(c, q, out, wet, ink) {
  if (q <= 0 || out >= 1) return false;
  c.globalAlpha *= Math.min(1, q * 2.5) * (1 - I(out));
  const e = E(q);
  return e >= 1 ? ink : mix(wet, ink, e);
}

// When a band laid from x0 to x1 during [t0, t1] passes a word box, in the reading direction.
export function passTime(box, x0, x1, t0, t1, rtl = true) {
  const w = x1 - x0, edge = rtl ? (x1 - (box.x + box.width)) / w : (box.x - x0) / w;
  const s = clamp(edge + 0.04);
  return t0 + (t1 - t0) * (s < 0.5 ? Math.sqrt(s / 2) : 1 - Math.sqrt((1 - s) / 2));   // inverse of BR
}

// Where kit.drawText puts each word (same arithmetic), to time words to the brush.
export function boxes(f, { x0, x1, y, align = 'center', rtl = true }) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++, left, rw: row.width }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
export function keySpans(bx) {
  const spans = [];
  for (const b of bx) {
    if (!b.key) continue;
    const last = spans.at(-1);
    if (last && last.row === b.row && last.last === b.i - 1) { last.x0 = Math.min(last.x0, b.x); last.x1 = Math.max(last.x1, b.x + b.width); last.last = b.i; }
    else spans.push({ x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, first: b.i, last: b.i });
  }
  return spans;
}

// Droplets flicked off the brush: seeded dots round a point, that appear when the brush lifts.
export function drops(seed, n, cx, cy, spread) {
  const r = rng(seed); return Array.from({ length: n }, () => { const a = r() * Math.PI * 2, d = spread * (0.35 + r() * 0.65); return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.6, r: 2 + r() * 7, k: r() }; });
}
export function splash(ctx, D, p, color) {
  if (p <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  for (const d of D) { const q = clamp(p * 1.6 - d.k * 0.6); if (q <= 0) continue; ctx.fillStyle = rgba(color, 0.55); ctx.beginPath(); ctx.arc(d.x, d.y, d.r * E(q), 0, 7); ctx.fill(); }
  ctx.restore();
}
