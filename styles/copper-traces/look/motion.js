// Copper-traces motion: nothing flies in. Everything on the board is already etched; what moves is current. A pulse of light runs
// along a trace, reaches a pad, and the pad and the words wired to it power up: a dim, unpowered silkscreen word comes to full
// brightness with a short halo and a settle of a few pixels. Leaving is a power-down: the words lose their light and lift off.
// This file also holds what the copper parts share: the palette, routes (polylines measured by length), traces, pads, vias, glow.
import { clamp, ease, mix, rgba, contrast } from '/engine/kit.js';

export const E = ease.outCubic;          // a word settling after it is powered
export const Q = ease.outQuart;          // a pulse arriving
export const I = ease.inQuad;            // power-down

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

// The board's colours, all from the brand: the darker brand colour tinted a little by the accent is the solder mask; copper under the
// mask is a lighter mix of the same; exposed metal (pads, vias) is the accent lifted toward the light colour; silkscreen is the light
// colour; current is the accent (lifted when the accent is too dark to glow on the mask).
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors, tn = T.tone;
  const [dark, light] = lum(bg) <= lum(text) ? [bg, text] : [text, bg];
  const mask = mix(dark, accent, tn.mask), pour = mix(dark, accent, tn.pour), rim = mix(dark, accent, tn.rim);
  const gold = mix(accent, light, tn.gold), sheen = mix(accent, light, tn.sheen);
  const glow = contrast(accent, mask) >= 2.6 ? accent : mix(accent, light, 0.45);
  const on = (fill) => (contrast(fill, dark) >= contrast(fill, light) ? dark : light);
  return { dark, light, accent, mask, pour, rim, gold, sheen, glow, core: mix(glow, light, 0.7), silk: mix(light, mask, 0.06),
    dim: mix(light, mask, tn.dim), ghost: mix(light, mask, 0.8), hole: mix(dark, '#000000', 0.4), body: mix(dark, '#000000', 0.3), onGold: on(gold), on };
}

// ---- routes: a polyline measured once, drawn to any length ----
export function route(pts) {
  const seg = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
  return { pts, seg, total };
}
// The part of a route between two lengths, as a path (not stroked).
export function sub(ctx, R, a, b) {
  a = clamp(a, 0, R.total); b = clamp(b, 0, R.total); ctx.beginPath(); if (b <= a) return false;
  let s = 0, started = false;
  for (let i = 1; i < R.pts.length; i++) {
    const l = R.seg[i - 1], p0 = R.pts[i - 1], p1 = R.pts[i];
    const u0 = clamp((a - s) / (l || 1)), u1 = clamp((b - s) / (l || 1));
    if (u1 > u0) {
      const x0 = p0[0] + (p1[0] - p0[0]) * u0, y0 = p0[1] + (p1[1] - p0[1]) * u0;
      if (!started) { ctx.moveTo(x0, y0); started = true; }
      ctx.lineTo(p0[0] + (p1[0] - p0[0]) * u1, p0[1] + (p1[1] - p0[1]) * u1);
    }
    s += l; if (s >= b) break;
  }
  return started;
}
export function at(R, a) {
  a = clamp(a, 0, R.total); let s = 0;
  for (let i = 1; i < R.pts.length; i++) { const l = R.seg[i - 1]; if (s + l >= a) { const u = (a - s) / (l || 1), p0 = R.pts[i - 1], p1 = R.pts[i]; return [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u]; } s += l; }
  return R.pts.at(-1);
}
// A copper trace in its channel: the clearance (mask) is wider than the copper, so the trace reads as cut out of the pour.
export function trace(ctx, R, P, w = 8, a = 0, b = Infinity, clear = true) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (clear) { if (sub(ctx, R, a, b)) { ctx.strokeStyle = P.mask; ctx.lineWidth = w + 12; ctx.stroke(); } }
  if (sub(ctx, R, a, b)) { ctx.strokeStyle = P.rim; ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = P.pour; ctx.lineWidth = w * 0.45; ctx.stroke(); }
}
// Current on a trace, from length a to b: a wide faint stroke, a narrower one, a bright core. k scales its strength.
export function glow(ctx, R, P, a, b, w = 8, k = 1) {
  if (k <= 0 || !sub(ctx, R, a, b)) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba(P.glow, 0.16 * k); ctx.lineWidth = w * 3.6; ctx.stroke();
  ctx.strokeStyle = rgba(P.glow, 0.45 * k); ctx.lineWidth = w * 1.7; ctx.stroke();
  ctx.strokeStyle = rgba(P.core, Math.min(1, k)); ctx.lineWidth = w * 0.6; ctx.stroke();
  ctx.restore();
}
// A pulse running a route: its head is at `p` of the route, its tail `len` px behind. Returns the head position.
export function pulse(ctx, R, P, p, len = 120, w = 8, k = 1) {
  const head = R.total * clamp(p); glow(ctx, R, P, head - len, head, w, k); return at(R, head);
}
// Parallel copies of a polyline, `pitch` apart, mitred at the corners (for buses of traces).
export function bus(pts, n, pitch) {
  const out = [];
  for (let j = 0; j < n; j++) {
    const d = (j - (n - 1) / 2) * pitch;
    out.push(pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const n1 = i > 0 ? norm(pts[i - 1], p) : norm(p, b), n2 = i < pts.length - 1 ? norm(p, b) : n1;
      let nx = n1[0] + n2[0], ny = n1[1] + n2[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const k = 1 / Math.max(0.5, nx * n1[0] + ny * n1[1]);
      void a; return [p[0] + nx * d * k, p[1] + ny * d * k];
    }));
  }
  return out;
}
const norm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };

// ---- metal ----
// A pad of exposed metal, with a sheen band on its top third. lit (0..1) adds current: a halo and a brighter face.
export function pad(ctx, x, y, w, h, r, P, lit = 0) {
  if (lit > 0) halo(ctx, x - w * 0.6, y - h * 0.6, w * 2.2, h * 2.2, P, 0.55 * lit);
  ctx.fillStyle = P.gold; ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = rgba(P.sheen, 0.55); ctx.fillRect(x, y + h * 0.08, w, h * 0.24);
  if (lit > 0) { ctx.fillStyle = rgba(P.core, 0.35 * lit); ctx.fillRect(x, y, w, h); }
  ctx.restore();
}
export function via(ctx, x, y, r, P, lit = 0) {
  if (lit > 0) halo(ctx, x - r * 3, y - r * 3, r * 6, r * 6, P, 0.6 * lit);
  ctx.fillStyle = lit > 0 ? mix(P.gold, P.core, 0.5 * lit) : P.gold; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.hole; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 2); ctx.fill();
}

// A soft glow, drawn from one radial picture made once per colour and stretched to the box (no blur filter per frame).
const halos = new Map();
export function halo(ctx, x, y, w, h, P, a = 1) {
  if (a <= 0.003 || w <= 0 || h <= 0) return;
  let c = halos.get(P.glow);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, rgba(P.glow, 0.9)); gr.addColorStop(0.45, rgba(P.glow, 0.35)); gr.addColorStop(1, rgba(P.glow, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); halos.set(P.glow, c);
  }
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.drawImage(c, x, y, w, h); ctx.restore();
}

// ---- words ----
// A word wired to the board: before t0 it is printed but unpowered (a ghost); at t0 the current reaches it and it comes up to full
// silkscreen over T.dur.in with a short halo behind it, settling up a few pixels. `out` (0..1) powers it down: it dims and lifts.
export function power(ctx, t, t0, dur, box, size, P, out = 0, ghostFrom = t0 - 0.35) {
  const g = clamp((t - ghostFrom) / 0.2), p = clamp((t - t0) / dur);
  if (g <= 0 || out >= 1) return false;
  const e = E(p), o = I(out);
  ctx.globalAlpha *= (0.22 * g + 0.78 * e) * (1 - o);
  if (p > 0 && p < 1) halo(ctx, box.x - size * 0.5, box.y - size * 0.9, box.width + size, size * 1.8, P, 0.5 * Math.sin(Math.PI * p));
  ctx.translate(0, (1 - e) * size * 0.08 - o * size * 0.25);
}

// Where each word of a fitted text stands, measured once (nothing is drawn).
export function boxes(kit, f, o) {
  const out = [], c = document.createElement('canvas').getContext('2d');
  kit.drawText(c, f, { ...o, each: (w, i, b) => { out.push({ ...b, key: w.key, i }); return false; } });
  return out;
}

// A text field on the board: a flat stretch of solder mask with a thin silkscreen outline and corner marks, so words never sit on copper.
export function field(ctx, x0, y0, x1, y1, P, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = P.mask; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = rgba(P.silk, 0.35); ctx.lineWidth = 2; ctx.strokeRect(x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2);
  ctx.restore();
}
// A chip body: black epoxy with a pin-1 dot on the reading side and a silkscreen outline a little outside it.
export function chip(ctx, x0, y0, x1, y1, P, rtl = true) {
  ctx.fillStyle = P.body; ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 6); ctx.fill();
  ctx.strokeStyle = rgba(P.silk, 0.7); ctx.lineWidth = 2.5; ctx.strokeRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16);
  ctx.fillStyle = rgba(P.silk, 0.5); ctx.beginPath(); ctx.arc(rtl ? x1 - 22 : x0 + 22, y0 + 22, 7, 0, Math.PI * 2); ctx.fill();
}

// Key words next to each other on one row share one backing: their boxes merged per row.
export function spans(bs) {
  const rows = new Map();
  for (const b of bs) { const r = rows.get(b.row); if (!r) rows.set(b.row, { ...b }); else { const x0 = Math.min(r.x, b.x), x1 = Math.max(r.x + r.width, b.x + b.width); r.x = x0; r.width = x1 - x0; } }
  return [...rows.values()];
}
