// Stick-talk motion: plain stick people on flat paper explain the idea with their bodies. Every figure is one even line weight: a round
// head on the neck, a curved spine, and limbs that are each one smooth curve (no corner at an elbow or knee). People stand on the
// "system line"; when two of them hold hands, the two arms become one continuous curve from shoulder to shoulder. The accent is a pulse
// that travels through the linked arms and along the line like fluid in a pipe, and each figure responds as it arrives.
// This file holds the palette, the figure, the joined arm, the run along a path, the underline and the word entrance.
import { clamp, mix, contrast, rgba, lerp, ease } from '/engine/kit.js';

export const lum = (h) => contrast(h, '#000000');
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  let g = 0.5, note = mix(light, dark, g); while (contrast(note, light) < 4.8 && g < 0.95) { g += 0.04; note = mix(light, dark, g); }
  // the accent must show on the paper as a line: when it is too close to the paper, it is deepened toward the ink
  let a = accent, j = 0; while (contrast(a, light) < 2.2 && j < 0.7) { j += 0.1; a = mix(accent, dark, j); }
  return { dark, light, paper: light, ink: dark, note, accent: a, faint: mix(light, dark, 0.22), slump: mix(light, dark, 0.42), grain: T.tone.grain };
}

export const weight = (h) => 8 * Math.min(1.05, Math.max(0.6, Math.sqrt(h / 380)));

// A figure standing at (x, yF), h tall. pose (all optional):
//   lean (px the neck leans), hop (px off the ground), slump 0..1 (head and back drop), spread (feet apart, px),
//   hands: { l: [x, y] | null, r: [x, y] | null } world points the hands reach for (null: they hang), head: 'paper' | 'accent',
//   color (the line colour), skipArms: { l, r } (an arm drawn elsewhere as part of a joined pair).
// Returns the shoulder and the resting hand points, so joined arms can be drawn between neighbours.
export function figure(ctx, P, x, yF, h, pose = {}) {
  const w = weight(h), hop = pose.hop ?? 0, sl = pose.slump ?? 0, lean = (pose.lean ?? 0) + sl * h * 0.08, spread = pose.spread ?? h * 0.13;
  const col = pose.color ?? P.ink, y = yF - hop;
  const hip = [x, y - h * 0.46], neck = [x + lean, y - h * (0.8 - 0.06 * sl)], r = h * 0.085;
  const head = [neck[0] + sl * h * 0.07, neck[1] - r * (1 - 0.35 * sl) - w * 0.2];
  const sh = [lerp(hip[0], neck[0], 0.86), lerp(hip[1], neck[1], 0.86)];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = w; ctx.strokeStyle = col;
  const q = (a, c, b) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]); ctx.stroke(); };
  // legs: one curve each, the knee only bends the curve
  for (const s of [-1, 1]) { const f = [x + s * spread, y], k = [x + s * spread * 0.5 + h * 0.03, lerp(hip[1], y, 0.5)]; q(hip, k, f); }
  // spine
  q(hip, [x + lean * 0.2 - sl * h * 0.05, lerp(hip[1], neck[1], 0.5)], neck);
  // arms
  const rest = { l: [sh[0] - h * 0.12, sh[1] + h * 0.3 + sl * h * 0.05], r: [sh[0] + h * 0.12, sh[1] + h * 0.3 + sl * h * 0.05] };
  for (const s of ['l', 'r']) {
    if (pose.skipArms?.[s]) continue;
    const hand = pose.hands?.[s] ?? rest[s], d = s === 'l' ? -1 : 1, L = Math.hypot(hand[0] - sh[0], hand[1] - sh[1]);
    const mid = [(sh[0] + hand[0]) / 2, (sh[1] + hand[1]) / 2], el = [mid[0] + d * L * 0.16, mid[1] + L * 0.12];
    q(sh, el, hand);
  }
  // head: a paper disc with an ink ring, or solid accent for the one who matters
  ctx.beginPath(); ctx.arc(head[0], head[1], r, 0, Math.PI * 2);
  if (pose.head === 'accent') { ctx.fillStyle = P.accent; ctx.fill(); ctx.strokeStyle = P.accent; ctx.stroke(); }
  else { ctx.fillStyle = P.paper; ctx.fill(); ctx.stroke(); }
  ctx.restore();
  return { sh, head, rest, w };
}

// One joined arm between two shoulders: a single smooth curve that sags to the clasp (0.17 h below the shoulders) when hanging, or
// arches above them when lifted (lift 0..1). Returns the curve as points, for a run to follow.
export function joined(a, b, h, lift = 0) {
  const sag = lerp(h * 0.34, -h * 0.5, lift), c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag], pts = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]); }
  return pts;
}
// Two hands on their way to a clasp, p 0..1: each arm is drawn from its shoulder toward the meeting point; at 1 they are one curve.
export function reach(ctx, P, a, b, h, p, w, lift = 0, color = P.ink) {
  const pts = joined(a, b, h, lift), n = pts.length - 1, half = Math.round(n / 2), m = Math.round(half * clamp(p));
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const line = (list) => { ctx.beginPath(); list.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
  if (p >= 1) line(pts);
  else {
    // before they meet, each hand hangs a little lower and swings in toward the clasp
    const drop = (1 - p) * h * 0.12;
    line(pts.slice(0, Math.max(2, m + 1)).map(([x, y], i) => [x, y + drop * (i / half)]));
    line(pts.slice(n - Math.max(1, m)).map(([x, y], i, arr) => [x, y + drop * (1 - i / (arr.length - 1 || 1))]));
  }
  ctx.restore();
  return pts;
}

// The accent run: draws a polyline up to `len` px of its length, with a round front. Returns the point the front has reached.
export function run(ctx, pts, len, width, color) {
  if (len <= 0 || pts.length < 2) return null;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  let acc = 0, at = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + s >= len) { const u = (len - acc) / (s || 1); at = [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; ctx.lineTo(at[0], at[1]); acc = len; break; }
    acc += s; at = pts[i]; ctx.lineTo(at[0], at[1]);
  }
  ctx.stroke(); ctx.restore();
  return at;
}
export const lengthOf = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
// The distance along a path to the point nearest x (paths here run mostly sideways), for timing a reaction.
export function distTo(pts, x) {
  let acc = 0, best = 0, bd = Infinity;
  for (let i = 0; i < pts.length; i++) { if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); const d = Math.abs(pts[i][0] - x); if (d < bd) { bd = d; best = acc; } }
  return best;
}
// The reaction as the run passes: a small hop that rises and settles over 0.35 s after the run reaches the person.
export const reactHop = (since, h) => (since <= 0 || since > 0.4 ? 0 : Math.sin(Math.PI * since / 0.4) * h * 0.09);

// Where kit.drawText puts each word (the kit's own rule).
export function layout(f, { x0, x1, y, align = 'center' }, rtl) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, key: w.key }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
// Key words that touch on one row share one underline.
export function keySpans(f, opts, rtl, all = false) {
  const out = [];
  layout(f, opts, rtl).forEach((b, i, L) => {
    if (!(all || b.key)) return;
    const p = out.at(-1);
    if (p && p.y === b.y && p.last === i - 1) { const a = Math.min(p.x, b.x), e = Math.max(p.x + p.width, b.x + b.width); p.x = a; p.width = e - a; p.last = i; }
    else out.push({ ...b, last: i });
  });
  return out;
}
// The underline under a key word: an accent stroke drawn like the run, from the reading side.
export function underline(ctx, P, b, size, p, rtl) {
  if (p <= 0) return;
  const y = b.y + size * 0.66, x0 = b.x - 4, x1 = b.x + b.width + 4, e = ease.inOutCubic(clamp(p));
  const pts = rtl ? [[x1, y], [lerp(x1, x0, e), y]] : [[x0, y], [lerp(x0, x1, e), y]];
  run(ctx, pts, Infinity, Math.max(9, size * 0.13), P.accent);
}
// A word set down: it drops the last few pixels onto its line, with opacity as a short helper.
export function setDown(c, p, size) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const e = ease.outCubic(p); c.globalAlpha *= Math.min(1, p * 3); c.translate(0, -(1 - e) * size * 0.22);
}
export { clamp, rgba, lerp, ease, mix };
