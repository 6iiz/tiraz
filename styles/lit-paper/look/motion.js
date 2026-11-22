// Lit-paper motion: a shadow box of cut card lit from behind. Sheets are flat and stacked; what moves is a sheet sliding in its groove
// (up into place, or down and out of the box), the light behind a cut coming on, and the box itself breathing a little so the layers
// slide against each other (parallax). Text is never printed: it is cut through a dark sheet, and the lamp shows through the cuts.
// This file holds the palette, the card (a sheet with a cloud-scalloped edge, rim light on its top edge and its cast shadow), the way a
// cut lights up, the key-phrase slot, and the word layout.
import { clamp, mix, contrast, rng, rgba } from '/engine/kit.js';

export const O = (p) => 1 - (1 - clamp(p)) ** 3;
export const I = (p) => clamp(p) ** 2;
const lum = (h) => contrast(h, '#000000');
export const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// The value ladder is the depth: the lamp is the brand's lighter colour warmed by a little accent; sheets darken toward the front.
// Text cut through the dark card glows in `glow`; a key phrase glows through a sheet of accent tissue (`key`, the accent lifted toward the
// light until it reads 4.5:1 on the card).
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const tint = (c) => mix(c, accent, 0.1);
  const card = mix(dark, light, 0.09);
  let k = 0, key = accent; while (k < 0.9 && contrast(key, card) < 4.6) { k += 0.05; key = mix(accent, light, k); }
  return {
    light, dark, accent, card, key,
    glow: mix(light, accent, 0.1), dim: mix(card, light, 0.2),
    sky0: mix(light, accent, 0.16), sky1: tint(mix(light, dark, 0.3)), sky2: tint(mix(light, dark, 0.62)),
    l1: tint(mix(light, dark, 0.45)), l2: tint(mix(light, dark, 0.62)), l3: tint(mix(light, dark, 0.8)), front: mix(dark, light, 0.03),
  };
}

export function grain(g, w, h, seed, a = 0.06) {
  const r = rng(seed); g.save(); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < w * h / 160; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.6})`; g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5); }
  for (let i = 0; i < 10; i++) { const x = r() * w, y = r() * h, R = 30 + r() * Math.max(w, h) * 0.25, gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, `rgba(0,0,0,${a * 0.7})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R); }
  g.restore();
}
// A sheet: draws `shape` (a function that makes a path on g) filled with `color`, a thin rim of lamp light along its upper edges, grain.
// Returns { img, shadow } of the same size; the shadow is the soft dark the sheet casts on the sheet behind.
export function sheet(w, h, shape, color, rim, seed, blur = 10, rule = 'nonzero') {
  const c = cv(w, h), g = c.getContext('2d');
  g.save(); g.translate(0, -2.5); shape(g); g.fillStyle = rim; g.fill(rule); g.restore();
  shape(g); g.fillStyle = color; g.fill(rule);
  grain(g, w, h, seed);
  const s = cv(w, h), q = s.getContext('2d'); q.filter = `blur(${blur}px)`; shape(q); q.fillStyle = 'rgba(0,0,0,0.55)'; q.fill(rule); q.filter = 'none';
  return { img: c, shadow: s, w, h };
}
// A path: a rectangle whose top and bottom edges are rows of cloud bumps.
export function cloudRect(x, y, w, h, r = 26) {
  return (g, fresh = true) => {
    const n = Math.max(2, Math.round(w / (r * 1.7))), s = w / n;
    if (fresh) g.beginPath();
    g.moveTo(x, y + r);
    for (let i = 0; i < n; i++) g.arc(x + s * (i + 0.5), y + r, s / 2, Math.PI, 0);
    g.lineTo(x + w, y + h - r);
    for (let i = n - 1; i >= 0; i--) g.arc(x + s * (i + 0.5), y + h - r, s / 2, 0, Math.PI);
    g.closePath();
  };
}
const cards = new Map();
// The card that carries a text: built once per size. pad: room around the content.
export function card(w, h, P, seed = 5) {
  const key = [Math.round(w), Math.round(h), P.card, seed].join('|'); if (cards.has(key)) return cards.get(key);
  const m = 40, S = sheet(w + 2 * m, h + 2 * m, cloudRect(m, m, w, h, 24), P.card, rgba(P.glow, 0.85), seed, 14);
  S.m = m; cards.set(key, S); return S;
}
// Draws a card with its shadow; `lift` 0..1 is how far it stands off the sheets behind (1 = just slotted in, the shadow wide and soft).
export function layCard(ctx, C, x, y, lift = 0) {
  ctx.save(); ctx.globalAlpha = 0.85 - 0.25 * lift; ctx.drawImage(C.shadow, x - C.m + 12 + lift * 26, y - C.m + 22 + lift * 40); ctx.restore();
  ctx.drawImage(C.img, x - C.m, y - C.m);
}
// The slide of a sheet in its groove: arrives from below (p 0..1), leaves downward (q 0..1). Returns { dy, lift } or null when away.
export function groove(p, q, dist = 150) {
  if (p <= 0 || q >= 1) return null;
  const a = O(p), b = I(q);
  return { dy: (1 - a) * dist + b * dist * 1.6, lift: Math.max(1 - a, b) };
}
// A cut lighting up: p 0..1. Before: the paper is uncut (nothing drawn). Then the cut shows dark, and the lamp comes up behind it.
// Sets colour and bloom on c; returns false before the cut.
export function light(c, p, col, P, bloom = 18) {
  if (p <= 0) return false;
  const q = O(p);
  c.fillStyle = q >= 1 ? col : mix(P.dim, col, q);
  c.shadowColor = rgba(col, 0.55 * q); c.shadowBlur = bloom * q;
  return c.fillStyle;
}
// The key slot: a thin cut under a run of key words, with a small diamond cut at each end, glowing through the accent tissue.
export function slot(c, x0, x1, y, size, p, P) {
  if (p <= 0) return;
  const q = O(p), w = (x1 - x0) * q, cx = (x0 + x1) / 2, yy = y + size * 0.66, d = size * 0.09;
  c.save(); c.fillStyle = P.key; c.shadowColor = rgba(P.key, 0.7); c.shadowBlur = 16;
  c.fillRect(cx - w / 2, yy - 3, w, 6);
  if (q > 0.6) for (const x of [cx - w / 2 - d * 2, cx + w / 2 + d * 2]) { c.beginPath(); c.moveTo(x - d, yy); c.lineTo(x, yy - d); c.lineTo(x + d, yy); c.lineTo(x, yy + d); c.closePath(); c.fill(); }
  c.restore();
}

// Where kit.drawText puts each word of a fitted text (the same arithmetic), and the runs of consecutive key words on one row: a key
// phrase of several words gets one slot, not one per word.
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
// Keep a key phrase whole and give it room: the words of a fitted text are packed again so that a run of key words never breaks across
// rows, and an invisible spacer word sits between the run and a neighbour on its row, so the run reads as one lit phrase.
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
