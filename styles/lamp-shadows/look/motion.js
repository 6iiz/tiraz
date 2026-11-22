// Lamp-shadows motion: a shadow theatre. Things are flat pieces of dyed hide held on thin rods against a lit cloth screen. A piece that
// arrives is brought from the lamp to the cloth: it starts large, soft and pale (far from the screen) and is pressed flat, sharp and dark,
// sliding in from the reading side. A piece that leaves is pulled back toward the lamp: it grows, softens and thins away. Pieces held on a
// rod never stand quite still; a key piece gets one tap of the rod (a short bob that dies out). This file holds what the parts share: the
// palette, the lamp's flicker, press and lift, the rod, the carved hide pieces (plaque, medallion, tag, lattice panel) and the word layout.
import { clamp, mix, contrast, rng, rgba } from '/engine/kit.js';

export const O = (p) => 1 - (1 - clamp(p)) ** 3;
const lum = (h) => contrast(h, '#000000');
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// The screen is the brand's lighter colour lit from behind (a touch of the accent, the dye of the lamp's light); the shadows are its darker
// colour; the hide is the accent. A plaque behind a key word is the accent seen through the cloth, thinned until dark text reads on it.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const screen = mix(light, accent, 0.07);
  let k = 0.64, hide = mix(screen, accent, k);
  while (k > 0.2 && contrast(hide, dark) < 5) { k -= 0.04; hide = mix(screen, accent, k); }
  return {
    light, dark, accent, screen, hide, ink: dark,
    edge: mix(screen, dark, 0.3), soft: mix(dark, screen, 0.28),
    dye: mix(accent, screen, 0.15), rim: mix(accent, dark, 0.45), deep: mix(accent, dark, 0.18),
    wood: mix(dark, light, 0.06), wood2: mix(dark, light, 0.13),
  };
}

// The oil lamp: a small irregular flicker (about 7 a second), 0..1. Used at low strength only, at the edges of the screen.
export const flick = (t) => clamp(0.5 + 0.22 * Math.sin(t * 43.1) + 0.16 * Math.sin(t * 27.7 + 1.3) + 0.12 * Math.sin(t * 61.9 + 0.4));

// Press: p 0..1. dir: +1 slides in from the right, -1 from the left. Returns false before it starts.
export function press(c, p, cx, cy, dir = 1) {
  if (p <= 0) return false;
  if (p >= 1) return;
  const q = O(p), s = 1 + (1 - q) * 0.22, b = (1 - q) * 14;
  c.globalAlpha *= 0.3 + 0.7 * q;
  c.translate(cx + (1 - q) * 80 * dir, cy); c.scale(s, s); c.translate(-cx, -cy);
  if (b > 0.4) c.filter = `blur(${b.toFixed(1)}px)`;
}
// Lift: the piece is pulled back toward the lamp. p 0..1; returns false once it is gone.
export function lift(c, p, cx, cy) {
  if (p <= 0) return;
  if (p >= 1) return false;
  const q = p * p, s = 1 + q * 0.35, b = q * 22;
  c.globalAlpha *= 1 - q;
  c.translate(cx, cy - q * 30); c.scale(s, s); c.translate(-cx, -cy);
  if (b > 0.4) c.filter = `blur(${b.toFixed(1)}px)`;
}
// The rod's tap: a short vertical bob that dies out, plus the steady tremble of a hand.
export function bob(t, t0, seed = 0) {
  const u = t - t0, tap = u > 0 ? -8 * Math.exp(-5 * u) * Math.sin(u * 15) : 0;
  return tap + 0.9 * Math.sin(t * 4.3 + seed * 1.7);
}
// A rod: a thin soft line from a rivet toward the bottom of the screen, fading as it leaves the cloth.
export function rod(c, x, y, dx, len, P) {
  const g = c.createLinearGradient(x, y, x + dx, y + len);
  g.addColorStop(0, rgba(P.dark, 0.5)); g.addColorStop(1, rgba(P.dark, 0));
  c.save(); c.strokeStyle = g; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx, y + len); c.stroke();
  c.fillStyle = P.rim; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
  c.restore();
}

// Hide: mottling and fibres laid only on the piece (source-atop), so the holes stay clean.
export function mottle(g, w, h, seed) {
  const r = rng(seed); g.save(); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 14; i++) {
    const x = r() * w, y = r() * h, R = 10 + r() * Math.max(w, h) * 0.3, gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, `rgba(0,0,0,${0.03 + r() * 0.05})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R);
  }
  g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 1;
  for (let i = 0; i < w * h / 900; i++) { const x = r() * w, y = r() * h, a = r() * 0.6 - 0.3, l = 5 + r() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.restore();
}
const diamond = (g, x, y, rx, ry) => { g.beginPath(); g.moveTo(x - rx, y); g.lineTo(x, y - ry); g.lineTo(x + rx, y); g.lineTo(x, y + ry); g.closePath(); g.fill(); };
const coin = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };

// A plaque: a strip of hide with pointed ends, a dyed rim, a row of coin holes along each long edge and lattice diamonds in the points.
// w, h: the outer size; px: how far the points reach past the text. Built once. -> { img, w, h }
const cache = new Map();
export function plaque(w, h, px, P, seed = 3) {
  const key = ['pl', Math.round(w), Math.round(h), Math.round(px), P.hide, seed].join('|'); if (cache.has(key)) return cache.get(key);
  const pad = 6, c = cv(w + 2 * pad, h + 2 * pad), g = c.getContext('2d'); g.translate(pad, pad);
  const e = Math.max(h * 0.32, px);
  g.beginPath(); g.moveTo(0, h / 2);
  g.bezierCurveTo(e * 0.35, h * 0.12, e * 0.6, 0, e, 0); g.lineTo(w - e, 0); g.bezierCurveTo(w - e * 0.6, 0, w - e * 0.35, h * 0.12, w, h / 2);
  g.bezierCurveTo(w - e * 0.35, h * 0.88, w - e * 0.6, h, w - e, h); g.lineTo(e, h); g.bezierCurveTo(e * 0.6, h, e * 0.35, h * 0.88, 0, h / 2); g.closePath();
  g.fillStyle = P.hide; g.fill();
  mottle(g, w, h, seed);
  g.lineWidth = 3.5; g.strokeStyle = P.rim; g.stroke();
  g.globalCompositeOperation = 'destination-out';
  const hr = Math.max(2.5, h * 0.038), step = hr * 4.4, n = Math.max(1, Math.floor((w - 2 * e) / step));
  for (let i = 0; i <= n; i++) { const x = e + (w - 2 * e) * (i / n); coin(g, x, h * 0.1, hr); coin(g, x, h * 0.9, hr); }
  if (px > h * 0.42) for (const x of [e * 0.52, w - e * 0.52]) { diamond(g, x, h / 2, h * 0.1, h * 0.16); coin(g, x, h / 2 - h * 0.27, hr * 0.9); coin(g, x, h / 2 + h * 0.27, hr * 0.9); }
  g.globalCompositeOperation = 'source-over';
  const P2 = { img: c, w: c.width, h: c.height }; cache.set(key, P2); return P2;
}
// A medallion: a disc of hide with a ring of crescents and a ring of coin holes; the centre stays solid. fill: its colour.
export function medallion(R, fill, P, seed = 5) {
  const key = ['md', Math.round(R), fill, seed].join('|'); if (cache.has(key)) return cache.get(key);
  const S = 2 * R + 12, c = cv(S, S), g = c.getContext('2d'); g.translate(S / 2, S / 2);
  g.beginPath();
  for (let i = 0; i <= 480; i++) { const a = (i / 480) * Math.PI * 2, r = R * (0.96 + 0.04 * Math.cos(a * 24)); i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath(); g.fillStyle = fill; g.fill(); mottle(g, S, S, seed);
  g.lineWidth = 4; g.strokeStyle = P.rim; g.stroke();
  g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 24; k++) {                                         // crescents: a hole, then hide put back slightly inward
    const a = (k / 24) * Math.PI * 2, rr = R * 0.84, x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    g.globalCompositeOperation = 'destination-out'; coin(g, x, y, R * 0.07);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = fill; coin(g, x - Math.cos(a) * R * 0.035, y - Math.sin(a) * R * 0.035, R * 0.062);
  }
  g.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; coin(g, Math.cos(a) * R * 0.71, Math.sin(a) * R * 0.71, R * 0.022); }
  g.globalCompositeOperation = 'source-over';
  g.lineWidth = 2.5; g.strokeStyle = P.rim; g.beginPath(); g.arc(0, 0, R * 0.65, 0, Math.PI * 2); g.stroke();
  const P2 = { img: c, w: S, h: S }; cache.set(key, P2); return P2;
}
// A small hanging tag: a lattice diamond of dyed hide with a rivet on top (a list's bullet).
export function tag(s, P, seed = 9) {
  const key = ['tg', s, P.dye, seed].join('|'); if (cache.has(key)) return cache.get(key);
  const c = cv(s + 8, s * 1.4 + 8), g = c.getContext('2d'); g.translate(4, 4);
  g.fillStyle = P.dye; diamond(g, s / 2, s * 0.75, s / 2, s * 0.65); mottle(g, s, s * 1.4, seed);
  g.strokeStyle = P.rim; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, s * 0.75); g.lineTo(s / 2, s * 0.1); g.lineTo(s, s * 0.75); g.lineTo(s / 2, s * 1.4); g.closePath(); g.stroke();
  g.globalCompositeOperation = 'destination-out';
  diamond(g, s / 2, s * 0.75, s * 0.15, s * 0.2);
  for (const [dx, dy] of [[-0.24, 0], [0.24, 0], [0, -0.33], [0, 0.33]]) coin(g, s / 2 + dx * s, s * 0.75 + dy * s, s * 0.055);
  g.globalCompositeOperation = 'source-over'; g.fillStyle = P.rim; coin(g, s / 2, s * 0.16, 4);
  const P2 = { img: c, w: c.width, h: c.height }; cache.set(key, P2); return P2;
}
// A tall lattice panel of hide (the joint's scenery flat): solid stiles at both sides, a diamond lattice between them.
export function lattice(w, h, P) {
  const key = ['lt', w, h, P.dye].join('|'); if (cache.has(key)) return cache.get(key);
  const c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = P.dye; g.fillRect(0, 0, w, h); mottle(g, w, h, 41);
  g.globalCompositeOperation = 'destination-out';
  const st = 46, cell = 52;
  for (let y = 30, row = 0; y < h; y += cell * 0.5, row++) for (let x = st + 26 + (row % 2) * cell / 2; x < w - st - 10; x += cell) diamond(g, x, y, cell * 0.36, cell * 0.21);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = P.rim; g.fillRect(st - 4, 0, 4, h); g.fillRect(w - st, 0, 4, h);
  cache.set(key, c); return c;
}
// Draws a built piece centred on (x, y).
export function lay(c, piece, x, y) { c.drawImage(piece.img, x - piece.w / 2, y - piece.h / 2); }

// Where kit.drawText puts each word of a fitted text (the same arithmetic), and the runs of consecutive key words on one row: a key
// phrase of several words gets one plaque, not one per word.
export function wordBoxes(f, x0, x1, y, align, rtl) {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, ph: w.ph, idx: w.idx ?? out.length }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
export function keyRuns(f, x0, x1, y, align, rtl) {
  const runs = []; let cur = null;
  wordBoxes(f, x0, x1, y, align, rtl).forEach((w, i) => {
    if (w.ph) return;
    if (!w.key) { cur = null; return; }
    if (cur && cur.row === w.row && cur.last === w.idx - 1) { cur.x0 = Math.min(cur.x0, w.x); cur.x1 = Math.max(cur.x1, w.x + w.width); cur.last = w.idx; }
    else { cur = { row: w.row, y: w.y, x0: w.x, x1: w.x + w.width, first: w.idx, last: w.idx }; runs.push(cur); }
  });
  return runs;
}
// A plaque sized for a run of key words of a text set at `size`, kept inside the screen's width.
export const plaquePx = (size) => size * 0.48;
export function runPlaque(run, size, P, seed, maxPx = Infinity) {
  const tw = run.x1 - run.x0, h = size * 1.8, px = Math.max(size * 0.3, Math.min(plaquePx(size), maxPx, (1000 - tw) / 2));
  return plaque(tw + 2 * px, h, px, P, seed);
}

// Keep a key phrase whole and give it room: the words of a fitted text are packed again so that a run of key words never breaks across
// rows, and an invisible spacer word sits between the run and a neighbour on its row, so the run's backing does not reach the neighbour.
// gap: the clear distance wanted between the run's edge and the next word. Every word carries `idx` (its index in the text) and a spacer
// `ph: true`, so an `each` callback can skip spacers (return false) and time words by `w.idx`. Returns a new fitted text.
export function isolate(f, gap, maxW) {
  const all = f.rows.flatMap((r) => r.words).map((w, idx) => ({ ...w, idx }));
  const units = [];
  for (const w of all) { const u = units.at(-1); if (w.key && u && u.key) u.words.push(w); else units.push({ key: !!w.key, words: [w] }); }
  if (!units.some((u) => u.key)) { let i = 0; return { ...f, rows: f.rows.map((r) => ({ ...r, words: r.words.map((x) => ({ ...x, idx: i++ })) })) }; }
  units.forEach((u) => { u.width = u.words.reduce((s, w) => s + w.width, 0) + f.space * (u.words.length - 1); });
  const sep = (a, b) => (a.key || b.key ? Math.max(f.space, gap) : f.space);
  const pack = (lim) => {
    const out = [[]]; let w = 0;
    for (const u of units) {
      const r = out.at(-1), add = r.length ? sep(r.at(-1), u) + u.width : u.width;
      if (r.length && w + add > lim) { out.push([u]); w = u.width; } else { r.push(u); w += add; }
    }
    return out;
  };
  let rowsU = pack(maxW);
  if (rowsU.length > 1) {                                   // balance the rows: the narrowest width that needs no more rows
    let lo = Math.max(...units.map((u) => u.width)), hi = maxW;
    for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (pack(mid).length > rowsU.length) lo = mid; else hi = mid; }
    rowsU = pack(hi);
  }
  const rows = rowsU.map((ru) => {
    const words = [];
    ru.forEach((u, k) => {
      if (k && (u.key || ru[k - 1].key)) { const pw = Math.max(0, gap - 2 * f.space); if (pw > 0) words.push({ w: '', key: false, width: pw, arabic: true, ph: true }); }
      words.push(...u.words);
    });
    return { words, width: words.reduce((s, x) => s + x.width, 0) + f.space * (words.length - 1) };
  });
  return { ...f, rows, width: Math.max(...rows.map((r) => r.width)), height: rows.length * f.lead };
}
