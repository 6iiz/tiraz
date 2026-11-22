// Facet Isle motion and geometry. Everything that arrives drops in from above and lands with one small springy bounce (about 6 %
// over, settled by 70 % of the move); things leave by lifting off and thinning out. This file also holds what every facet-isle file
// shares: the palette built from the brand's three colours, a tiny orthographic projector for flat-shaded solids, the faceted
// "gem bar" that carries words, and the word layout used to put one emphasis under a whole key phrase.
import { clamp, mix, contrast, ease } from '/engine/kit.js';

// ---------- curves ----------
// The landing: a quick fall that passes its mark by a few percent and settles back. Ends exactly on 1.
export const B = (p) => { p = clamp(p); if (p >= 1) return 1; const c = 1.25; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; };
export const L = ease.outCubic;          // soft land for things that only slide (rules, a pillar's growth between steps)
export const I = (p) => clamp(p) ** 2.4; // lift off

// A word or box drops in from `fall` px above with the bounce; opacity is only a short helper at the very start.
export function drop(ctx, p, fall = 70) {
  if (p <= 0) return false;
  ctx.globalAlpha *= clamp(p * 5);
  ctx.translate(0, -(1 - B(p)) * fall);
}
// Leaves upward, thinning out.
export function lift(ctx, p, rise = 90) {
  if (p >= 1) return false;
  if (p <= 0) return;
  ctx.globalAlpha *= 1 - clamp(p * 1.3);
  ctx.translate(0, -I(p) * rise);
}

// ---------- colour ----------
const lumOf = (c) => contrast(c, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lumOf(bg) >= lumOf(text) ? bg : text, dark = light === bg ? text : bg;
  const on = (fill) => (contrast(fill, bg) >= contrast(fill, text) ? bg : text);
  // flat shading: s = n·light in -1..1 → a step towards the light or the dark brand colour
  const cache = new Map();
  const tone = (base, s) => {
    const q = Math.round(Math.max(-1, Math.min(1, s)) * 24), id = base + q;
    let c = cache.get(id);
    if (!c) { const k = (q / 24 + 1) / 2; c = k > 0.62 ? mix(base, light, (k - 0.62) * 0.75) : mix(base, dark, (0.62 - k) * 0.8); cache.set(id, c); }
    return c;
  };
  return {
    bg, text, accent, light, dark, on, tone,
    skyLow: mix(bg, accent, 0.16),
    muted: mix(text, bg, 0.32),
    sea: mix(bg, accent, 0.3),
    sand: mix(bg, text, 0.42),
    grass: mix(accent, bg, 0.08),
    hill: mix(accent, dark, 0.32),
    rock: mix(text, bg, 0.1),
    trunk: mix(dark, accent, 0.25),
    panel: mix(bg, text, 0.16),
    onAccent: on(accent),
    keyText: contrast(accent, bg) >= 3 ? accent : text,
  };
}

// ---------- a tiny orthographic projector ----------
// The camera looks down at 30 degrees. World: x right, y up, z towards the viewer (after the island's turn).
const SE = 0.5, CE = Math.sqrt(3) / 2;
export const LIGHT = (() => { const v = [-0.55, 0.78, 0.32], n = Math.hypot(...v); return v.map((x) => x / n); })();
export function cam(cx, cy, S) {
  return { cx, cy, S, at: (X, Y, Z) => [cx + X * S, cy - Y * S * CE + Z * S * SE], depth: (X, Y, Z) => Y * SE + Z * CE };
}

// Solid builders; faces are lists of [x, y, z] in the solid's own space.
export function prismY(poly, y0, y1) {          // a vertical prism over a polygon in the x-z plane
  const top = poly.map(([x, z]) => [x, y1, z]), bot = poly.map(([x, z]) => [x, y0, z]);
  const f = [top];
  for (let i = 0; i < poly.length; i++) { const j = (i + 1) % poly.length; f.push([bot[i], bot[j], top[j], top[i]]); }
  return f;
}
export function prismZ(poly, z0, z1) {          // a horizontal prism over a polygon in the x-y plane (a roof)
  const a = poly.map(([x, y]) => [x, y, z0]), b = poly.map(([x, y]) => [x, y, z1]);
  const f = [a, b];
  for (let i = 0; i < poly.length; i++) { const j = (i + 1) % poly.length; f.push([a[i], a[j], b[j], b[i]]); }
  return f;
}
export function pyramid(poly, y0, apex) {
  const f = [];
  for (let i = 0; i < poly.length; i++) { const j = (i + 1) % poly.length; f.push([[poly[i][0], y0, poly[i][1]], [poly[j][0], y0, poly[j][1]], [0, apex, 0]]); }
  return f;
}
export function gem(r, h) {                     // an octahedron standing on its point
  const q = [[r, 0], [0, r], [-r, 0], [0, -r]], f = [];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4;
    f.push([[q[i][0], h / 2, q[i][1]], [q[j][0], h / 2, q[j][1]], [0, h, 0]]);
    f.push([[q[i][0], h / 2, q[i][1]], [q[j][0], h / 2, q[j][1]], [0, 0, 0]]); }
  return f;
}
export const ngon = (n, r, a0 = Math.PI / 6) => Array.from({ length: n }, (_, i) => [Math.cos(a0 + (i * 2 * Math.PI) / n) * r, Math.sin(a0 + (i * 2 * Math.PI) / n) * r]);

// Draws a convex solid: faces turned away are skipped, the rest are filled flat with the tone of their angle to the light.
// o: { faces, color, at: [x, y, z] (world, before the turn), sx, sy (scale), turn (radians), lift (y) }
export function drawSolid(ctx, C, o, a, tone) {
  const ca = Math.cos(a), sa = Math.sin(a);
  const sx = o.sx ?? 1, sy = o.sy ?? 1, [wx, wy, wz] = o.at, own = o.turn ?? 0, co = Math.cos(own), so = Math.sin(own);
  const tf = ([x, y, z]) => {
    x *= sx; z *= sx; y *= sy;
    const x1 = x * co - z * so, z1 = x * so + z * co;
    const X = wx + x1, Z = wz + z1;
    return [X * ca - Z * sa, y + wy + (o.lift ?? 0), X * sa + Z * ca];
  };
  const cen = tf([0, (o.mid ?? 0.5), 0]);
  for (const face of o.faces) {
    const P = face.map(tf);
    const u = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], v = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = Math.hypot(...n) || 1; n = n.map((x) => x / m);
    const fc = P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length, s[2] + p[2] / P.length], [0, 0, 0]);
    if ((fc[0] - cen[0]) * n[0] + (fc[1] - cen[1]) * n[1] + (fc[2] - cen[2]) * n[2] < 0) n = n.map((x) => -x);
    if (n[1] * SE + n[2] * CE <= 0.001) continue;
    const s = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
    ctx.fillStyle = tone(o.color, s); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.8;
    ctx.beginPath();
    P.forEach(([X, Y, Z], i) => { const [px, py] = C.at(X, Y, Z); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.closePath(); ctx.fill(); ctx.stroke();       // the hairline stroke closes the seams between faces
  }
}
// depth key of a solid's base, for sorting (larger is nearer)
export function depthOf(o, a) { const [x, , z] = o.at; return x * Math.sin(a) + z * Math.cos(a); }

// ---------- the gem bar: a faceted plaque that carries words ----------
// Front face x0..x1, y0..y1 (text sits on it, level and unturned); a bevel above and below, and pointed facet ends.
export function gemBar(ctx, P, x0, x1, y0, y1, base) {
  const h = y1 - y0, dA = h * 0.26, dC = h * 0.2, s = h * 0.18, tip = h * 0.42, ym = (y0 + y1) / 2;
  const poly = (pts, c) => { ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 0.8; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke(); };
  const TL = [x0 - tip, ym], TR = [x1 + tip, ym];
  poly([[x0 + s, y0 - dA], [x1 - s, y0 - dA], [x1, y0], [x0, y0]], P.tone(base, 0.95));        // upper bevel, catches the light
  poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], base);                                        // the face
  poly([[x0, y1], [x1, y1], [x1 - s, y1 + dC], [x0 + s, y1 + dC]], P.tone(base, -0.55));       // lower bevel
  poly([TL, [x0 + s, y0 - dA], [x0, y0]], P.tone(base, 0.7));                                   // the lit end
  poly([TL, [x0, y0], [x0, y1]], P.tone(base, 0.32));
  poly([TL, [x0, y1], [x0 + s, y1 + dC]], P.tone(base, -0.3));
  poly([TR, [x1 - s, y0 - dA], [x1, y0]], P.tone(base, 0.2));                                   // the shaded end
  poly([TR, [x1, y0], [x1, y1]], P.tone(base, -0.35));
  poly([TR, [x1, y1], [x1 - s, y1 + dC]], P.tone(base, -0.8));
}
// the flat shadow a floating thing throws on the sky below it (a neutral dark at low alpha)
export function hover(ctx, cx, y, w, k = 1) {
  ctx.save(); ctx.globalAlpha *= 0.16 * k; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(cx, y, w / 2, w * 0.045 + 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

// ---------- words ----------
// Where kit.drawText will put each word (same arithmetic), so a box can be drawn under a whole phrase before the words.
export function layout(f, x0, x1, y, rtl, align = 'start') {
  const out = []; let i = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start') === rtl ? x1 - row.width : x0;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ i: i++, key: w.key, x: wl, y: yy, width: w.width, row: r }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
// Neighbouring key words on one row become one run: one emphasis for a whole key phrase.
export function runs(boxes) {
  const out = [];
  for (const b of boxes) {
    if (!b.key) continue;
    const r = out.at(-1);
    if (r && r.row === b.row && r.last === b.i - 1) { r.x0 = Math.min(r.x0, b.x); r.x1 = Math.max(r.x1, b.x + b.width); r.last = b.i; r.n++; }
    else out.push({ row: b.row, y: b.y, x0: b.x, x1: b.x + b.width, first: b.i, last: b.i, n: 1 });
  }
  return out;
}
