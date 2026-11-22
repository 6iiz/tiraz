// Street wash motion: line first, then wash. Every shape is drawn with a thin pen line that wobbles, overshoots its corners and does
// not quite close; a moment later a transparent wash is dropped on it, a few pixels off the line, as a sketcher colours a page on the
// spot. Words are written in the reading direction (each word uncovered by the moving pen, never split); the key word is looped round by
// the pen and gets a dab of the brand's colour. This file holds the palette, the pen strokes and the washes every part shares.
import { clamp, mix, rgba, contrast, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const I = (p) => clamp(p) ** 2.4;
export const PEN = (p) => { p = clamp(p); return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2; };

const lum = (c) => contrast(c, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(bg) >= lum(text) ? bg : text, ink = paper === bg ? text : bg;
  const grey = (k) => mix(paper, ink, k);
  const quiet = (k) => { let c = grey(k); while (k < 1 && contrast(c, paper) < 4.5) { k += 0.04; c = grey(Math.min(1, k)); } return c; };
  // how strong a wash of the accent may be with ink still reading on it at 4.5:1 (a glaze of alpha a looks about like mix(paper, accent, a))
  const washA = (a) => { while (a > 0.15 && contrast(mix(paper, accent, a), ink) < 4.5) a -= 0.04; return a; };
  return { paper, ink, accent, grey, quiet, washA, line: mix(ink, accent, 0.12), wash: accent, shade: ink, rgba };
}

// ---- pen strokes: arrays of points with their running length, drawn up to a fraction ----
function measure(pts) { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, L: cum.at(-1) }; }
// A wobbly line through points, each segment resampled, with overshoot at both ends and maybe one small gap.
export function pen(points, seed, { wob = 1.2, over = 6, gap = true } = {}) {
  const r = rng(seed), out = [];
  const a = points[0], b = points[1], z = points.at(-1), y = points.at(-2);
  const ext = (p, q, d) => { const dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * d, p[1] + dy / l * d]; };
  const P = [ext(a, b, over * (0.4 + r())), ...points.slice(0), ext(z, y, over * (0.4 + r()))];
  let phase = r() * 9;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[i + 1], l = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(l / 9)), nx = -(y1 - y0) / (l || 1), ny = (x1 - x0) / (l || 1);
    for (let k = 0; k < n; k++) { const s = k / n, w = Math.sin(phase += 0.45 + r() * 0.3) * wob + (r() - 0.5) * wob * 0.6; out.push([x0 + (x1 - x0) * s + nx * w, y0 + (y1 - y0) * s + ny * w]); }
  }
  out.push(P.at(-1));
  const m = measure(out);
  m.gap = gap && m.L > 160 ? [0.35 + r() * 0.3, 0] : null; if (m.gap) m.gap[1] = m.gap[0] + 7 / m.L;
  return m;
}
export function draw(ctx, S, p, color, width = 2.6) {
  p = clamp(p); if (p <= 0) return;
  const end = p * S.L; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  let up = false;
  for (let i = 0; i < S.pts.length; i++) {
    const s = S.cum[i] / S.L, inGap = S.gap && s > S.gap[0] && s < S.gap[1];
    if (S.cum[i] > end) { const k = i - 1, f = (end - S.cum[k]) / (S.cum[i] - S.cum[k] || 1); ctx.lineTo(S.pts[k][0] + (S.pts[i][0] - S.pts[k][0]) * f, S.pts[k][1] + (S.pts[i][1] - S.pts[k][1]) * f); break; }
    if (inGap) { up = true; continue; }
    if (up || i === 0) { ctx.moveTo(S.pts[i][0], S.pts[i][1]); up = false; } else ctx.lineTo(S.pts[i][0], S.pts[i][1]);
  }
  ctx.stroke(); ctx.restore();
}
// Several strokes drawn one after another over p (a shape drawn in pen order).
export function drawAll(ctx, list, p, color, width) { const n = list.length; list.forEach((S, i) => draw(ctx, S, clamp(p * n - i), color, width)); }

// A box drawn as four separate sides, each overshooting.
export function box(x, y, w, h, seed) {
  const r = rng(seed), j = () => (r() - 0.5) * 6;
  return [pen([[x + w + j(), y + j()], [x + j(), y + j()]], seed + 1, { over: 9 }), pen([[x + j(), y + j()], [x + j(), y + h + j()]], seed + 2, { over: 8 }),
    pen([[x + j(), y + h + j()], [x + w + j(), y + h + j()]], seed + 3, { over: 10 }), pen([[x + w + j(), y + h + j()], [x + w + j(), y + j()]], seed + 4, { over: 7 })];
}
// A loose loop round a word: a little more than one turn, not closing on itself.
export function loop(cx, cy, rx, ry, seed, rtl = true) {
  const r = rng(seed), pts = [], a0 = rtl ? -0.4 : Math.PI + 0.4, dir = rtl ? -1 : 1;
  for (let k = 0; k <= 40; k++) { const s = k / 40, a = a0 + dir * s * Math.PI * 2.12, g = 1 + s * 0.09 + (r() - 0.5) * 0.02; pts.push([cx + Math.cos(a) * rx * g, cy + Math.sin(a) * ry * g - s * 6]); }
  return pen(pts, seed, { wob: 1.4, over: 4, gap: false });
}
// A zigzag scribble crossing out a region.
export function scribble(x0, x1, ym, h, seed, rtl = true) {
  const r = rng(seed), pts = [], n = Math.max(6, Math.round((x1 - x0) / 34));
  for (let k = 0; k <= n; k++) { const s = k / n, x = rtl ? x1 - s * (x1 - x0) : x0 + s * (x1 - x0); pts.push([x + (r() - 0.5) * 8, ym + (k % 2 ? -1 : 1) * h * (0.3 + r() * 0.2)]); }
  return pen(pts, seed, { wob: 0.8, over: 5, gap: false });
}
// A tick mark in a box.
export function tick(x, y, s, seed) { return pen([[x + s * 0.18, y + s * 0.52], [x + s * 0.42, y + s * 0.8], [x + s * 0.92, y + s * 0.05]], seed, { wob: 0.6, over: 4, gap: false }); }
// A curved arrow from a to b: the shaft, then the two barbs.
export function arrow(a, b, bend, seed) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, c = [mx - dy / l * bend, my + dx / l * bend];
  const pts = []; for (let k = 0; k <= 16; k++) { const s = k / 16; pts.push([(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]]); }
  const tx = b[0] - pts[14][0], ty = b[1] - pts[14][1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, h = 22;
  const barb = (sgn) => pen([[b[0] - ux * h + -uy * h * 0.6 * sgn, b[1] - uy * h + ux * h * 0.6 * sgn], b], seed + 5 + sgn, { wob: 0.4, over: 2, gap: false });
  return [pen(pts, seed, { wob: 1, over: 2, gap: false }), barb(1), barb(-1)];
}

// ---- washes: a rough-edged glaze sprite, built once, dropped a few pixels off its line ----
export function patch(w, h, color, alpha, seed) {
  const pad = 24, cv = document.createElement('canvas'); cv.width = Math.ceil(w + pad * 2); cv.height = Math.ceil(h + pad * 2);
  const g = cv.getContext('2d'), r = rng(seed);
  for (let pass = 0; pass < 3; pass++) {
    g.fillStyle = rgba(color, alpha / 2.3); g.beginPath();
    const N = 36; for (let i = 0; i < N; i++) {
      const s = i / N, side = Math.floor(s * 4), f = s * 4 - side, j = () => (r() - 0.5) * 12;
      const [x, y] = side === 0 ? [w * f, 0] : side === 1 ? [w, h * f] : side === 2 ? [w * (1 - f), h] : [0, h * (1 - f)];
      g.lineTo(pad + x + j(), pad + y + j());
    }
    g.closePath(); g.fill();
    if (pass === 2) { g.strokeStyle = rgba(color, Math.min(1, alpha * 0.7)); g.lineWidth = 2; g.stroke(); }
  }
  g.globalCompositeOperation = 'source-atop';                       // granulation
  for (let i = 0; i < w * h / 260; i++) { g.fillStyle = rgba(color, 0.15 + r() * 0.25); g.beginPath(); g.arc(r() * cv.width, r() * cv.height, 0.5 + r() * 1.5, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'destination-out';                   // a white reserve or two
  for (let i = 0; i < 2; i++) { g.beginPath(); g.ellipse(pad + r() * w, pad + r() * h, 6 + r() * 14, 4 + r() * 8, r() * 3, 0, 7); g.fill(); }
  return { cv, pad, w, h };
}
// Drops a patch at (x, y) (its top-left, before the off-register shift): it soaks in from transparent and spreads a little.
export function drop(ctx, P, x, y, p, off = [6, -4], alpha = 1) {
  p = clamp(p); if (p <= 0 || alpha <= 0) return;
  const e = E(p), s = 0.92 + 0.08 * e, cx = x + P.w / 2 + off[0], cy = y + P.h / 2 + off[1], W = P.cv.width * s, Hh = P.cv.height * s;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha *= Math.min(1, e * 1.4) * alpha;
  ctx.drawImage(P.cv, cx - W / 2, cy - Hh / 2, W, Hh); ctx.restore();
}

// A word is written: the moving pen uncovers it in the reading direction. q: 0..1, out: 0..1 (it is taken away quickly).
export function write(c, q, out, box, size, rtl = true) {
  if (q <= 0 || out >= 1) return false;
  if (out > 0) c.globalAlpha *= 1 - I(out);
  if (q < 1) {
    const w = (box.width + 16) * clamp(q), h = size * 1.7;
    c.beginPath(); c.rect(rtl ? box.x + box.width + 8 - w : box.x - 8, box.y - h / 2, w, h); c.clip();
  }
}

// Where kit.drawText puts each word, to place loops and washes.
export function boxes(f, { x0, x1, y, align = 'start', rtl = true }) {
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
// When each word is written: words follow each other like handwriting, with a short lift of the pen between them.
export function schedule(bx, t0, size, perPx = 0.0016, lift = 0.05) {
  let t = t0; return bx.map((b) => { const d = Math.max(0.12, b.width * perPx); const s = [t, t + d]; t += d + lift; return s; });
}
