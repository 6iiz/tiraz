// Sumi mist motion: nothing slides in. Ink is laid on paper and spreads: a word blooms out of a soft bleed of its own ink and sharpens,
// a stroke is painted along its length by a loaded brush that runs dry at its tail, and what leaves dissolves back into the paper like
// mist. This file also holds what every sumi part shares: the palette (five tones of one ink, one red for the seal), the brush, the seal.
import { clamp, mix, rgba, contrast, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;          // ink settling into the paper
export const I = (p) => clamp(p) ** 2.4;                  // dissolving away, faster at the end
export const B = (p) => 1 - (1 - clamp(p)) ** 1.6;        // the brush: quick at the start, slowing as it lifts

const lum = (c) => contrast(c, '#000000');
// Paper is the lighter of the brand's two colours, ink the darker. The accent is the seal's red, and only the seal's.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(bg) >= lum(text) ? bg : text, ink = paper === bg ? text : bg;
  const tone = (k) => mix(paper, ink, k);
  // the darkest of the five tones that still reads on paper at 4.5:1 is used for quiet text
  const quiet = (k) => { let c = tone(k); while (k < 1 && contrast(c, paper) < 4.5) { k += 0.04; c = tone(Math.min(1, k)); } return c; };
  const onSeal = contrast(accent, paper) >= contrast(accent, ink) ? paper : ink;
  return { paper, ink, seal: accent, onSeal, tone, quiet, grey: quiet(T.tone.zhong), rgba };
}

// Smooth 1D noise, seeded: n(s) in 0..1 for any s.
export function noise1(seed, n = 48) {
  const r = rng(seed), v = Array.from({ length: n + 1 }, () => r());
  return (s) => { const x = ((s % 1) + 1) % 1 * n, i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return v[i] + (v[i + 1] - v[i]) * u; };
}

// A centreline through a few points (Catmull-Rom), resampled to n even steps.
export function curve(pts, n = 90) {
  const dense = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t;
      dense.push([0, 1].map((a) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3)));
    }
  }
  dense.push(pts.at(-1));
  const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const L = cum.at(-1), out = []; let j = 0;
  for (let k = 0; k <= n; k++) {
    const d = (k / n) * L; while (j < cum.length - 2 && cum[j + 1] < d) j++;
    const f = (d - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
    out.push([dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f, dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f]);
  }
  return out;
}

// A loaded brush stroke, built once: a ribbon whose width follows the press of the brush (a pressed entry, a body, a lifted tail),
// roughened by noise, and a set of bristle tracks that break into dashes as the ink runs out ("flying white").
// o: { w, seed, rough, dry (0 wet .. 1 dry), bristles, lift (how thin the tail ends) }
export function stroke(pts, o = {}) {
  const { w = 40, seed = 1, rough = 0.22, dry = 0.35, bristles = 16, lift = 0.12 } = o;
  const P = curve(pts), n = P.length, nz = noise1(seed), nz2 = noise1(seed + 7);
  const N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  const prof = (s) => (s < 0.12 ? 0.55 + 0.45 * Math.sin((s / 0.12) * Math.PI / 2) : s > 0.7 ? lift + (1 - lift) * Math.cos(((s - 0.7) / 0.3) * Math.PI / 2) : 1);
  const W = P.map((_, i) => { const s = i / (n - 1); return w * prof(s) * (1 + rough * (nz(s * 0.9) - 0.5) * 2); });
  const r = rng(seed + 31), tracks = [];
  for (let j = 0; j < bristles; j++) {
    const off = (j / Math.max(1, bristles - 1) - 0.5) * 0.92, segs = []; let s = r() * 0.04;
    const runOut = 1 - dry * r() * 0.3;            // where this bristle's ink is gone
    while (s < runOut) { const len = 0.05 + r() * 0.3 * (1 - s * dry); segs.push([s, Math.min(runOut, s + len)]); s += len + r() * 0.06 * (0.3 + s * dry * 3); }
    tracks.push({ off, segs, lw: (w / bristles) * (0.7 + r() * 0.9), a: 0.55 + r() * 0.45 });
  }
  // where the solid body ends and only bristles carry on
  const body = 1 - dry * 0.4;
  return { P, N, W, n, tracks, body, nz2 };
}
// Paints a stroke up to p (0..1 of its length) in `color`. `alpha` scales the whole stroke.
export function paint(ctx, S, p, color, alpha = 1) {
  p = clamp(p); if (p <= 0 || alpha <= 0) return;
  const { P, N, W, n } = S, m = Math.max(2, Math.ceil(p * (n - 1)) + 1), mb = Math.max(2, Math.min(m, Math.ceil(S.body * (n - 1)) + 1));
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // the body
  ctx.globalAlpha = alpha * 0.9; ctx.beginPath();
  for (let i = 0; i < mb; i++) ctx.lineTo(P[i][0] + N[i][0] * W[i] / 2, P[i][1] + N[i][1] * W[i] / 2);
  for (let i = mb - 1; i >= 0; i--) ctx.lineTo(P[i][0] - N[i][0] * W[i] / 2, P[i][1] - N[i][1] * W[i] / 2);
  ctx.closePath(); ctx.fill();
  // the bristle tracks, darker where the brush was loaded on one side
  for (const tr of S.tracks) {
    ctx.lineWidth = tr.lw; ctx.globalAlpha = alpha * tr.a * (tr.off < 0 ? 1 : 0.7);
    for (const [s0, s1] of tr.segs) {
      if (s0 >= p) break;
      const i0 = Math.floor(s0 * (n - 1)), i1 = Math.floor(Math.min(s1, p) * (n - 1));
      if (i1 <= i0) continue;
      ctx.beginPath();
      for (let i = i0; i <= i1; i++) { const k = tr.off * W[i]; ctx.lineTo(P[i][0] + N[i][0] * k, P[i][1] + N[i][1] * k); }
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A word blooms: it starts as a soft bleed of its own ink and sharpens into the paper. Use inside kit.drawText's `each`.
// p: 0..1 arrival, out: 0..1 leaving (it dissolves upward into mist). Returns false when the word is not on the paper.
export function bloom(c, p, out, ink, size) {
  if (p <= 0 || out >= 1) return false;
  const e = E(p), o = I(out);
  c.globalAlpha *= Math.min(1, e * 1.15) * (1 - o);
  const blur = size * (0.42 * (1 - e) + 0.5 * o);
  if (blur > 0.5) { c.shadowColor = rgba(ink, 0.7 * (1 - e) + 0.5 * o); c.shadowBlur = blur; }
  c.translate(0, size * (0.06 * (1 - e) - 0.18 * o));
}

// The seal: a square of the red, a little rough at its edges, printed in one press. p: 0..1 (it presses down), at (x, y) its centre.
export function seal(ctx, x, y, s, pal, p, inside) {
  if (p <= 0) return;
  const e = E(p), k = 1.18 - 0.18 * e;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= Math.min(1, p * 3);
  ctx.fillStyle = pal.seal; ctx.beginPath();
  const h = s / 2, j = s * 0.025;
  ctx.moveTo(-h + j, -h); ctx.lineTo(h, -h + j); ctx.lineTo(h - j, h); ctx.lineTo(-h, h - j); ctx.closePath(); ctx.fill();
  // a worn edge: a few paper flecks in the red
  ctx.fillStyle = pal.paper; ctx.globalAlpha *= 0.55;
  for (const [a, b, r] of [[-0.38, -0.44, 0.04], [0.41, 0.2, 0.03], [-0.1, 0.45, 0.025], [0.3, -0.41, 0.02]]) { ctx.beginPath(); ctx.arc(a * s, b * s, r * s, 0, 7); ctx.fill(); }
  ctx.restore();
  if (inside) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); inside(); ctx.restore(); }
}

// A horizontal swash under a word, painted along the reading direction (right to left in Arabic). x0..x1: the word's extent.
export function swash(x0, x1, y, size, rtl, seed) {
  const a = rtl ? x1 + size * 0.32 : x0 - size * 0.32, b = rtl ? x0 - size * 0.3 : x1 + size * 0.3, len = b - a;
  return stroke([[a, y + size * 0.02], [a + len * 0.35, y - size * 0.06], [a + len * 0.7, y - size * 0.02], [b, y - size * 0.1]],
    { w: size * 0.95, seed, rough: 0.3, dry: 0.45, bristles: 24, lift: 0.4 });
}

// Where kit.drawText will put each word of a fitted text (the same arithmetic), so strokes can be painted under words before the words.
// Returns [{ x, y, width, row, key, i }].
export function boxes(f, { x0, x1, y, align = 'start', rtl = true }) {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++ }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
// Runs of neighbouring key words on one row become one span (a key phrase gets one swash).
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

// One circle in one breath: a brush stroke round a centre, starting at `a0` (radians) and going `sweep` of the way, the tail dry and
// open. Used round a number and round the seal at the end.
export function enso(cx, cy, R, { a0 = -2.2, sweep = 0.9, w = 34, seed = 61, dir = 1 } = {}) {
  const pts = [], nz = noise1(seed);
  for (let k = 0; k <= 14; k++) { const s = k / 14, a = a0 + dir * s * sweep * Math.PI * 2, rr = R * (1 + (nz(s) - 0.5) * 0.06 + s * 0.04); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return stroke(pts, { w, seed, rough: 0.28, dry: 0.6, bristles: 26, lift: 0.18 });
}
