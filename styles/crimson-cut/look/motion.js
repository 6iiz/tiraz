// Crimson-cut motion: paper cut with scissors and laid flat. Pieces are pasted on two drawings at 12 a second (a little large, then
// flat); folded patterns open with a snap ("pa!"), each half swinging over its fold line on ones; scraps drift on ones. Nothing fades,
// nothing glows. This file holds what the parts share: the paper families, the rosette (one wedge mirrored eight times, built once),
// the unfold, banners with swallow-tail ends, a paste, and the grain.
import { clamp, mix, contrast, rng } from '/engine/kit.js';

export const O = (p) => 1 - (1 - clamp(p)) ** 3;
export const steps12 = (t) => Math.floor(t * 12) / 12;
// A paste on twos: nothing before t0, 1.15 for one step, then 1.
export const paste = (t, t0) => (t < t0 ? 0 : t < t0 + 1 / 12 ? 1.08 : 1);

const lum = (h) => contrast(h, '#000000');
// The paper families: the ground is the brand's background, dyed paper; the hero is the accent, red paper. If the two are too close the
// ground moves to the brand's other colour, so the hero always stands off its ground.
export function papers(brand) {
  let { bg, text, accent } = brand.colors;
  if (contrast(accent, bg) < 1.7) [bg, text] = [text, bg];
  const dark = lum(bg) <= lum(text) ? bg : text, light = dark === bg ? text : bg;
  const on = (fill) => (contrast(fill, bg) >= contrast(fill, text) ? bg : text);
  const deep = mix(accent, dark, 0.32), far = mix(accent, bg, 0.64);
  return { ground: bg, txt: text, red: accent, deep, far, dark, light, on, onRed: on(accent), onDeep: contrast(deep, light) >= contrast(deep, dark) ? light : dark };
}

function grain(g, w, h, seed) {
  const r = rng(seed); g.save(); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < w * h / 260; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); }
  for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h, R = 20 + r() * Math.max(w, h) * 0.2, gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, 'rgba(0,0,0,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); }
  g.restore();
}
// Edge of a cut piece: a 1 px highlight on the upper-left edge, a shaded edge on the lower right, then a close paper shadow. -> { img, shadow }
function finish(c, seed) {
  const w = c.width, h = c.height, g = c.getContext('2d');
  grain(g, w, h, seed);
  const lit = document.createElement('canvas'); lit.width = w; lit.height = h; const l = lit.getContext('2d');
  l.drawImage(c, 0, 0); l.globalCompositeOperation = 'source-in'; l.fillStyle = 'rgba(255,255,255,0.35)'; l.fillRect(0, 0, w, h);
  const out = document.createElement('canvas'); out.width = w; out.height = h; const o = out.getContext('2d');
  o.drawImage(lit, -1, -1); o.globalCompositeOperation = 'destination-out'; o.drawImage(c, 0, 0); o.globalCompositeOperation = 'source-over';
  const dk = document.createElement('canvas'); dk.width = w; dk.height = h; const k = dk.getContext('2d');
  k.drawImage(c, 0, 0); k.globalCompositeOperation = 'source-in'; k.fillStyle = 'rgba(0,0,0,0.4)'; k.fillRect(0, 0, w, h);
  o.drawImage(dk, 1.5, 1.5); o.globalCompositeOperation = 'destination-out'; o.drawImage(c, 0, 0); o.globalCompositeOperation = 'source-over';
  g.drawImage(out, 0, 0);
  const sh = document.createElement('canvas'); sh.width = w; sh.height = h; const s = sh.getContext('2d');
  s.filter = 'blur(4px)'; s.drawImage(dk, 0, 0); s.filter = 'none';
  return { img: c, shadow: sh, w, h };
}
// Draws a finished piece centred on (x, y) with its shadow a few px down-right. k: a scale (a paste).
export function lay(ctx, P, x, y, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.drawImage(P.shadow, -P.w / 2 + 4, -P.h / 2 + 6); ctx.drawImage(P.img, -P.w / 2, -P.h / 2);
  ctx.restore();
}

// ---------- the rosette ----------
// One wedge of cuts (a half of 45 degrees) mirrored into 16, on a disc with a scalloped edge. ri: the radius of a solid centre left uncut
// (to carry a number or a logo), 0 for a pattern all through. Cuts never leave floating islands: the inset ring is dashed (its gaps are
// the bridges) and every hole is closed inside the paper.
const roseCache = new Map();
export function rosette(R, color, ri = 0, seed = 8) {
  const key = [R, color, ri, seed].join('|'); if (roseCache.has(key)) return roseCache.get(key);
  const S = Math.ceil(R * 2 + 8), c = document.createElement('canvas'); c.width = S; c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2);
  g.fillStyle = color; g.beginPath();
  for (let i = 0; i <= 720; i++) { const a = (i / 720) * Math.PI * 2, r = R * (0.93 + 0.07 * Math.abs(Math.cos(a * 8))); i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.fill();
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  const half = Math.PI / 8, r0 = Math.max(ri + R * 0.06, R * 0.16);
  const cuts = (q) => {                                               // the cuts of one half wedge, angles 0..half
    // a sawtooth ring near the edge
    for (let k = 0; k < 3; k++) { const a0 = (k / 3) * half, a1 = ((k + 1) / 3) * half, am = (a0 + a1) / 2, rr = R * 0.8;
      q.beginPath(); q.moveTo(Math.cos(a0 + 0.012) * rr, Math.sin(a0 + 0.012) * rr); q.lineTo(Math.cos(a1 - 0.012) * rr, Math.sin(a1 - 0.012) * rr); q.lineTo(Math.cos(am) * R * 0.875, Math.sin(am) * R * 0.875); q.fill(); }
    // a petal (crescent-like tear) in the middle band
    const pm = r0 + (R * 0.74 - r0) * 0.62, pa = half * 0.55;
    q.save(); q.rotate(pa); q.beginPath(); q.ellipse(pm, 0, (R * 0.74 - r0) * 0.26, R * 0.045, 0, 0, Math.PI * 2); q.fill(); q.restore();
    // a round hole and a tapered slit nearer the centre
    const hm = r0 + (R * 0.74 - r0) * 0.22; q.beginPath(); q.arc(Math.cos(half * 0.5) * hm, Math.sin(half * 0.5) * hm, R * 0.03, 0, Math.PI * 2); q.fill();
    q.save(); q.rotate(half * 0.97); q.beginPath(); q.moveTo(r0 + R * 0.02, 0); q.lineTo(R * 0.7, -R * 0.008); q.lineTo(R * 0.7, R * 0.008); q.closePath(); q.fill(); q.restore();
  };
  for (let k = 0; k < 8; k++) for (const m of [1, -1]) { g.save(); g.rotate((k / 8) * Math.PI * 2); g.scale(1, m); cuts(g); g.restore(); }
  // the inset contour: a dashed slit just inside the edge, and one around the solid centre
  g.lineWidth = Math.max(2, R * 0.012); g.strokeStyle = '#000'; g.setLineDash([R * 0.09, R * 0.035]);
  g.beginPath(); g.arc(0, 0, R * 0.9, 0, Math.PI * 2); g.stroke();
  if (ri > 0) { g.setLineDash([R * 0.06, R * 0.03]); g.beginPath(); g.arc(0, 0, ri + R * 0.03, 0, Math.PI * 2); g.stroke(); }
  g.globalCompositeOperation = 'source-over';
  const P = finish(c, seed); roseCache.set(key, P); return P;
}

// The unfold: the rosette opens from a folded wedge (1/8) to a quarter, a half and the whole, each half swinging over its fold line.
// u: seconds since it started; gap: seconds between unfolds; dur: how long a swing takes. A swinging half shows the paper's back (lighter)
// while it is past upright and darkens as it stands up.
export function unfold(ctx, P, x, y, u, { gap = 0.24, dur = 0.18, turn = 0 } = {}) {
  if (u < 0) return;
  const R = P.w / 2;
  let A = Math.PI / 4, swing = null;
  for (let k = 0; k < 3; k++) { const s0 = gap * (k + 1); if (u >= s0 + dur) A *= 2; else if (u >= s0) { swing = O((u - s0) / dur); break; } else break; }
  const sector = (a0, a1) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R + 4, a0, a1); ctx.closePath(); };
  ctx.save(); ctx.translate(x, y); ctx.rotate(turn - Math.PI / 2 - A / 2);
  const bump = A >= Math.PI * 2 && swing === null ? 1 + 0.06 * Math.max(0, 1 - (u - gap * 3 - dur) * 8) : 1;
  ctx.scale(bump, bump);
  ctx.save(); sector(0, A); ctx.clip(); ctx.drawImage(P.shadow, -R + 4, -R + 6); ctx.drawImage(P.img, -R, -R); ctx.restore();
  if (swing !== null) {
    const s = -1 + 2 * swing;                                     // -1: folded over the sector, 1: flat beside it
    ctx.save(); ctx.rotate(A); ctx.scale(1, s); ctx.rotate(-A);
    ctx.save(); sector(A, 2 * A); ctx.clip(); ctx.drawImage(P.img, -R, -R);
    ctx.fillStyle = s < 0 ? 'rgba(255,255,255,0.3)' : `rgba(0,0,0,${0.3 * (1 - Math.abs(s))})`; ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.restore(); ctx.restore();
  }
  ctx.restore();
}

// A banner: a strip of paper with swallow-tail ends and a sawtooth hem top and bottom, built once. -> a finished piece
const bannerCache = new Map();
export function banner(w, h, color, seed = 21) {
  const key = [Math.round(w), Math.round(h), color, seed].join('|'); if (bannerCache.has(key)) return bannerCache.get(key);
  const c = document.createElement('canvas'); c.width = Math.ceil(w + 8); c.height = Math.ceil(h + 8);
  const g = c.getContext('2d'), tail = Math.min(h * 0.45, 40), tooth = 14, td = 5;
  g.translate(4, 4); g.fillStyle = color; g.beginPath();
  g.moveTo(0, 0);
  for (let x = tooth; x < w; x += tooth) g.lineTo(x - tooth / 2, td * ((x / tooth) % 2 ? 1 : 0)), g.lineTo(x, 0);
  g.lineTo(w, 0); g.lineTo(w - tail, h / 2); g.lineTo(w, h);
  for (let x = w - tooth; x > 0; x -= tooth) g.lineTo(x + tooth / 2, h - td * (Math.round(x / tooth) % 2 ? 1 : 0)), g.lineTo(x, h);
  g.lineTo(0, h); g.lineTo(tail, h / 2); g.closePath(); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.lineWidth = 2; g.setLineDash([22, 8]);
  g.beginPath(); g.moveTo(tail + 10, 10); g.lineTo(w - tail - 10, 10); g.moveTo(tail + 10, h - 10); g.lineTo(w - tail - 10, h - 10); g.stroke();
  const P = finish(c, seed); bannerCache.set(key, P); return P;
}
// A plain card of paper (a rectangle with a slight hand-cut wobble). -> a finished piece
export function card(w, h, color, seed = 31) {
  const key = 'card|' + [Math.round(w), Math.round(h), color, seed].join('|'); if (bannerCache.has(key)) return bannerCache.get(key);
  const c = document.createElement('canvas'); c.width = Math.ceil(w + 8); c.height = Math.ceil(h + 8);
  const g = c.getContext('2d'), r = rng(seed); g.translate(4, 4); g.fillStyle = color; g.beginPath();
  const pts = [[0, 0], [w, 0], [w, h], [0, h]];
  pts.forEach(([x0, y0], i) => { const [x1, y1] = pts[(i + 1) % 4], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 12));
    for (let k = 0; k < n; k++) { const q = k / n, j = (r() - 0.5) * 2.4; g.lineTo(x0 + (x1 - x0) * q + (y1 === y0 ? 0 : j), y0 + (y1 - y0) * q + (y1 === y0 ? j : 0)); } });
  g.closePath(); g.fill();
  const P = finish(c, seed); bannerCache.set(key, P); return P;
}
