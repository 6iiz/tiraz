// Stylus Notes motion: a dark glass canvas that someone is drawing on with a stylus. Nothing fades in: every word is inked from the
// reading side as the stylus tip (a hover ring with a lit point) passes over it, and every mark (lasso, check, scribble, arrow) is a
// pressure-tapered digital stroke drawn along its length with a soft glow under it. The canvas itself moves only between ideas (the
// joint pans and pinches it); finished marks never move or boil. When the writing is done the tip hovers, lifted, near the last mark.
import { clamp, mix, rgba, contrast, rng } from '/engine/kit.js';

export const E = (p) => 1 - (1 - clamp(p)) ** 3;
export const glide = (p) => 1 - (1 - clamp(p)) ** 1.7;
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

// The glass is the darker brand colour (tinted a hair toward the accent), the ink the lighter one, whichever the brand calls bg.
export function palette(brand, T) {
  const a = brand.colors.bg, b = brand.colors.text, dark = lum(a) <= lum(b) ? a : b, light = dark === a ? b : a;
  let key = brand.colors.accent, k = 0;
  while (contrast(key, dark) < 4 && k < 1) { k += 0.08; key = mix(brand.colors.accent, light, k); }
  return { dark, light, accent: brand.colors.accent, key, glass: mix(dark, brand.colors.accent, T.tone.tint), grey: mix(dark, light, T.tone.grey), faint: mix(dark, light, T.tone.faint) };
}

// Where kit.drawText will put each word (the same arithmetic), so marks can be planned around words before anything is drawn.
export function layout(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = kit.rtl ? cur - w.width : cur;
      out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, index: index++, size: f.size, space: f.space });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return out;
}
// Consecutive key words on one row are one run: one lasso per phrase, never one per word.
export function runs(words) {
  const out = [];
  for (const w of words) {
    const last = out.at(-1);
    if (w.key && last && last.row === w.row && last.last === w.index - 1) { last.x0 = Math.min(last.x0, w.x); last.x1 = Math.max(last.x1, w.x + w.width); last.last = w.index; }
    else if (w.key) out.push({ x0: w.x, x1: w.x + w.width, y: w.y, row: w.row, first: w.index, last: w.index, size: w.size, space: w.space });
  }
  return out;
}
// The stylus writes one word after another: each word gets time in proportion to its width, all inside `total` seconds from `start`.
export function schedule(words, start, total, gap = 0.03) {
  const weight = words.map((w) => w.width + 70), sum = weight.reduce((a, b) => a + b, 0) || 1, free = Math.max(0.05, total - gap * (words.length - 1));
  let t = start; return words.map((w, i) => { const d = (free * weight[i]) / sum, s = { t0: t, t1: t + d }; t += d + gap; return s; });
}

// Inside kit.drawText's `each`: uncover the word from the reading side up to the stylus tip and give the ink its glow.
export function inkWord(ctx, p, box, size, rtl, glowCol) {
  if (p <= 0) return false;
  ctx.shadowColor = glowCol; ctx.shadowBlur = size * 0.28;
  if (p >= 1) return;
  const head = rtl ? box.x + box.width + 4 - (box.width + 8) * p : box.x - 4 + (box.width + 8) * p;
  ctx.beginPath();
  if (rtl) ctx.rect(head, box.y - size, box.x + box.width + size - head, size * 2); else ctx.rect(box.x - size, box.y - size, head - box.x + size, size * 2);
  ctx.clip();
}
// Where the tip is while a word is being written: it rides the word's middle band with a small writing wobble.
export function tipOn(box, p, size, rtl) {
  const x = rtl ? box.x + box.width - box.width * p : box.x + box.width * p;
  return { x, y: box.y + Math.sin(p * 23) * size * 0.16 + size * 0.05, down: true };
}
// The stylus tip: a hover ring with a lit point; down = touching the glass (small, bright), up = hovering (ring wider, dimmer).
export function tip(ctx, pt, pal, alpha = 1) {
  if (!pt || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const r = pt.down ? 13 : 20;
  const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 2.4);
  g.addColorStop(0, rgba(pal.accent, pt.down ? 0.45 : 0.22)); g.addColorStop(1, rgba(pal.accent, 0));
  ctx.fillStyle = g; ctx.fillRect(pt.x - r * 2.4, pt.y - r * 2.4, r * 4.8, r * 4.8);
  ctx.strokeStyle = rgba(pal.light, pt.down ? 0.75 : 0.45); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = pt.down ? pal.light : pal.accent; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.down ? 4 : 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// After the writing, the tip lifts and hovers near `pt`, drifting slowly so a held frame is never still.
export function hover(pt, t) { return { x: pt.x + Math.sin(t * 1.3) * 10 - 30, y: pt.y + 90 + Math.cos(t * 1.05) * 7, down: false }; }

// ---- strokes: a list of points with lengths; drawn along their length with a pressure taper and a glow underneath
export function stroke(pts) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, L, total: L.at(-1) || 1 };
}
export function at(S, p) {
  const d = S.total * clamp(p); let i = 1; while (i < S.pts.length - 1 && S.L[i] < d) i++;
  const a = S.pts[i - 1], b = S.pts[i], u = (d - S.L[i - 1]) / Math.max(1e-6, S.L[i] - S.L[i - 1]);
  return { x: a[0] + (b[0] - a[0]) * clamp(u), y: a[1] + (b[1] - a[1]) * clamp(u), down: true };
}
export function ink(ctx, S, p, width, color, glowCol, alpha = 1) {
  if (p <= 0 || alpha <= 0) return;
  const end = S.total * clamp(p), P = S.pts;
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = glowCol; ctx.lineWidth = width * 3.2; ctx.globalAlpha = alpha * 0.16;
  ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length && S.L[i - 1] < end; i++) { const q = at(S, Math.min(S.L[i], end) / S.total); ctx.lineTo(q.x, q.y); }
  ctx.stroke(); ctx.globalAlpha = alpha; ctx.strokeStyle = color;
  for (let i = 1; i < P.length && S.L[i - 1] < end; i++) {
    const u = S.L[i] / S.total, taper = Math.min(1, u / 0.1, (1 - u) / 0.16 + 0.15), q = at(S, Math.min(S.L[i], end) / S.total);
    ctx.lineWidth = width * (0.3 + 0.7 * clamp(taper)); ctx.beginPath(); ctx.moveTo(P[i - 1][0], P[i - 1][1]); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  ctx.restore();
}

// ---- mark shapes, built once
export function lasso(run, seed, rtl) {
  // a rounded-square loop (a superellipse), so its sides stand in the gaps between words instead of cutting the neighbours
  const r = rng(seed), cx = (run.x0 + run.x1) / 2, cy = run.y + run.size * 0.04;
  const rx = (run.x1 - run.x0) / 2 + Math.min((run.space ?? run.size * 0.3) * 0.45, run.size * 0.3), ry = run.size * 0.62;
  const ph = r() * 6, a0 = rtl ? -0.5 : Math.PI + 0.5, dir = rtl ? -1 : 1, pts = [], se = (v) => Math.sign(v) * Math.abs(v) ** 0.5;
  for (let i = 0; i <= 80; i++) {
    const u = i / 80, a = a0 + dir * u * Math.PI * 2 * 1.1, ky = 1 + 0.04 * Math.sin(a * 3 + ph) + 0.1 * u;
    pts.push([cx + se(Math.cos(a)) * rx * (1 + 0.01 * u), cy + se(Math.sin(a)) * ry * ky]);
  }
  return stroke(pts);
}
export function scribble(x0, x1, y, size, seed) {
  const r = rng(seed), n = 11, pts = [];
  for (let i = 0; i <= n; i++) pts.push([x1 - (x1 - x0) * (i / n) + (r() - 0.5) * 10, y + (i % 2 ? 1 : -1) * size * (0.22 + r() * 0.1)]);
  return stroke(pts);
}
export function underline(x0, x1, y, amp, seed) {
  const r = rng(seed), pts = [], ph = r() * 3;
  for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([x1 - (x1 - x0) * u, y + Math.sin(u * 9 + ph) * amp * (0.6 + 0.4 * u)]); }
  return stroke(pts);
}
export function box(x, y, s, seed) {
  const r = rng(seed), j = () => (r() - 0.5) * 2, pts = [];
  const corners = [[x + s, y], [x, y], [x, y + s], [x + s, y + s], [x + s, y - 3]];
  for (let c = 0; c < corners.length - 1; c++) for (let i = 0; i < 6; i++) { const u = i / 6, a = corners[c], b = corners[c + 1]; pts.push([a[0] + (b[0] - a[0]) * u + j(), a[1] + (b[1] - a[1]) * u + j()]); }
  pts.push(corners.at(-1));
  return stroke(pts);
}
export function check(x, y, s) {
  return stroke([[x + s * 0.12, y + s * 0.5], [x + s * 0.3, y + s * 0.66], [x + s * 0.42, y + s * 0.82], [x + s * 0.62, y + s * 0.45], [x + s * 0.84, y + s * 0.1], [x + s * 1.02, y - s * 0.18]]);
}
export function arrow(x0, y0, x1, y1, bend) {
  const pts = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30, mx = (x0 + x1) / 2 + bend, my = (y0 + y1) / 2; pts.push([(1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1]); }
  const [ax, ay] = pts.at(-1), [bx, by] = pts.at(-4), ang = Math.atan2(ay - by, ax - bx), h = 26;
  pts.push([ax - Math.cos(ang - 0.5) * h, ay - Math.sin(ang - 0.5) * h], [ax, ay], [ax - Math.cos(ang + 0.5) * h, ay - Math.sin(ang + 0.5) * h]);
  return stroke(pts);
}
// A faint construction guide (a dashed rule) under a row, left in like a sketch line.
export function guide(ctx, x0, x1, y, p, pal, rtl = true) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = rgba(pal.light, 0.1); ctx.lineWidth = 1.5; ctx.setLineDash([10, 9]);
  ctx.beginPath(); if (rtl) { ctx.moveTo(x1, y); ctx.lineTo(x1 - (x1 - x0) * E(p), y); } else { ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * E(p), y); } ctx.stroke(); ctx.restore();
}

// ---- the stylus's whole path through a part: events are { t0, t1, word: { box, size, rtl } } or { t0, t1, S } (a stroke)
const pointOf = (e, p) => (e.S ? at(e.S, p) : tipOn(e.word.box, clamp(p), e.word.size, e.word.rtl));
export function tipPath(events, t) {
  let prev = null;
  for (const e of events) {
    if (t < e.t0) {
      const b = pointOf(e, 0);
      if (!prev) { const u = clamp((t - (e.t0 - 0.3)) / 0.3); return u <= 0 ? null : { x: b.x + (1 - E(u)) * 120, y: b.y + (1 - E(u)) * 160, down: false, alpha: u }; }
      const a = pointOf(prev, 1), u = E(clamp((t - prev.t1) / Math.max(0.01, e.t0 - prev.t1)));
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - Math.sin(Math.PI * u) * 24, down: false };
    }
    if (t <= e.t1) return pointOf(e, (t - e.t0) / Math.max(0.001, e.t1 - e.t0));
    prev = e;
  }
  return prev ? hover(pointOf(prev, 1), t) : null;
}
