// Fold-out motion: a pop-up book. Every piece is a flat card of cut paper hinged on its bottom edge: it lies flat on the page and pops
// up (a quick rise that just passes upright and settles), and leaves by folding back down flat, faster. A key phrase gets an accent
// sticker that flips open on its own hinge a beat later. Pages turn between scenes. This file holds the palette, the cut-paper finish
// (ink outline, a thick paper border, a grey cardboard edge below it, a soft contact shadow), wobbly hand-cut shapes, the pop and the
// fold, and the word layout.
import { clamp, mix, contrast, rng } from '/engine/kit.js';

export const O = (p) => 1 - (1 - clamp(p)) ** 3;
const lum = (h) => contrast(h, '#000000');
export const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// The book's page is the brand's lighter colour; the ink is its darker colour warmed by a little accent (a brown-ish ink, never pure);
// the paper border is the lighter colour itself; the cardboard edge is a grey mixed from both. Accent pieces carry text in whichever
// of the two brand colours reads better on the accent.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const on = contrast(accent, dark) >= contrast(accent, light) ? dark : light;
  return {
    light, dark, accent, on,
    ink: mix(dark, accent, 0.12), paper: light, card: mix(light, dark, 0.02),
    page: mix(mix(light, accent, 0.05), dark, 0.06), floor: mix(mix(light, accent, 0.05), dark, 0.13),
    board: mix(light, dark, 0.38), cover: mix(accent, dark, 0.45), desk: mix(mix(dark, light, 0.2), accent, 0.1),
    soft: mix(dark, light, 0.32), tintA: mix(accent, light, 0.45), tintB: mix(accent, dark, 0.25), tintC: mix(accent, light, 0.7),
  };
}

export function grain(g, w, h, seed, a = 0.05) {
  const r = rng(seed); g.save(); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < w * h / 220; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5); }
  g.restore();
}
// A wobbly closed path through points (a hand-cut outline): each point is nudged by low-harmonic noise.
export function wobble(g, pts, amp, seed) {
  const r = rng(seed), ph = [r() * 6.28, r() * 6.28], n = pts.length;
  g.beginPath();
  pts.forEach(([x, y], i) => { const u = i / n, dx = amp * Math.sin(u * 6.28 * 2 + ph[0]), dy = amp * Math.sin(u * 6.28 * 3 + ph[1]); i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy); });
  g.closePath();
}
// Points around a rounded rectangle, spaced about every `step` px.
export function rectPts(x, y, w, h, rad = 18, step = 14) {
  const pts = [], arc = (cx, cy, a0) => { for (let k = 0; k <= 4; k++) { const a = a0 + (k / 4) * Math.PI / 2; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } };
  const line = (x0, y0, x1, y1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)); for (let k = 1; k < n; k++) pts.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]); };
  arc(x + rad, y + rad, Math.PI); line(x + rad, y, x + w - rad, y);
  arc(x + w - rad, y + rad, -Math.PI / 2); line(x + w, y + rad, x + w, y + h - rad);
  arc(x + w - rad, y + h - rad, 0); line(x + w - rad, y + h, x + rad, y + h);
  arc(x + rad, y + h - rad, Math.PI / 2); line(x, y + h - rad, x, y + rad);
  return pts;
}
// The cut-paper finish. art(g) draws the piece (fills and ink lines) into a canvas of w x h with `m` px of margin already around it.
// Returns { img, shadow, w, h, m }: img has the paper border and the cardboard edge; shadow is its soft contact shadow.
export function piece(w, h, art, P, { border = 9, edge = 5, seed = 1 } = {}) {
  const m = border + edge + 14, W = w + 2 * m, H = h + 2 * m;
  const a = cv(W, H), g = a.getContext('2d'); g.translate(m, m); art(g); g.setTransform(1, 0, 0, 1, 0, 0); grain(g, W, H, seed);
  const dil = (color) => {
    const c = cv(W, H), q = c.getContext('2d');
    for (const rr of [border * 0.5, border]) for (let k = 0; k < 20; k++) { const t = (k / 20) * Math.PI * 2; q.drawImage(a, Math.cos(t) * rr, Math.sin(t) * rr); }
    q.drawImage(a, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = color; q.fillRect(0, 0, W, H); return c;
  };
  const bord = dil(P.paper), side = dil(P.board);
  const img = cv(W, H), o = img.getContext('2d');
  o.drawImage(side, 0, edge); o.drawImage(bord, 0, 0); grain(o, W, H, seed + 7, 0.035); o.drawImage(a, 0, 0);
  const shadow = cv(W, H), s = shadow.getContext('2d'); s.filter = 'blur(9px)'; s.drawImage(side, 0, 0); s.filter = 'none';
  s.globalCompositeOperation = 'source-in'; s.fillStyle = 'rgba(0,0,0,0.3)'; s.fillRect(0, 0, W, H);
  return { img, shadow, w, h, m };
}
// A plain card: a wobbly rounded rectangle, filled, outlined in ink.
const cards = new Map();
export function card(w, h, fill, P, seed = 3) {
  const key = [Math.round(w), Math.round(h), fill, P.ink, seed].join('|'); if (cards.has(key)) return cards.get(key);
  const pc = piece(w, h, (g) => { wobble(g, rectPts(0, 0, w, h, Math.min(22, h / 3)), 1.6, seed); g.fillStyle = fill; g.fill(); g.lineWidth = 4; g.strokeStyle = P.ink; g.lineJoin = 'round'; g.stroke(); }, P, { seed });
  cards.set(key, pc); return pc;
}
// The pop: p 0..1 -> the height of a card hinged at its bottom edge, as a fraction (just passes 1 and settles). The fold: q 0..1 -> the
// fraction left as it folds back flat, accelerating.
export const pop = (p) => { p = clamp(p); if (p <= 0) return 0; if (p >= 1) return 1; return 1 - Math.cos(p * Math.PI * 1.25) * Math.exp(-3.4 * p) * (1 - p); };
export const fold = (q) => 1 - clamp(q) ** 2;
// Draws a piece whose bottom edge sits on y = base, centred on x, raised to s (0 flat .. 1 upright). Its shadow lies on the page
// behind it and shortens as it stands. inner(ctx) draws what is printed on it, in the piece's own coordinates (its centre is (x, base - h/2)).
export function stand(ctx, pc, x, base, s, inner) {
  if (s <= 0.01) return;
  const top = base - pc.h - pc.m, left = x - pc.w / 2 - pc.m;
  ctx.save(); ctx.globalAlpha = Math.min(1, s * 1.5); ctx.drawImage(pc.shadow, left + 10, top + 16 + (1 - s) * 20); ctx.restore();
  ctx.save(); ctx.translate(0, base); ctx.scale(1, s); ctx.translate(0, -base);
  ctx.drawImage(pc.img, left, top);
  if (s < 0.98) { ctx.fillStyle = `rgba(0,0,0,${0.22 * (1 - s)})`; ctx.fillRect(x - pc.w / 2 - 4, base - pc.h - 4, pc.w + 8, pc.h + 8); }   // facing away from the lamp
  if (inner) inner(ctx);
  ctx.restore();
}
// The V-fold strut under a standing card: two small grey triangles from the page to the card's back.
export function strut(ctx, x, base, s, P) {
  if (s <= 0.05) return;
  ctx.save(); ctx.fillStyle = P.board; ctx.globalAlpha = 0.9;
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 120, base); ctx.lineTo(x + d * 170, base + 26 * s); ctx.lineTo(x + d * 70, base + 26 * s); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// A flap that flips open on a vertical hinge at its centre: sets the transform. p 0..1.
export function flip(ctx, p, cx) { const s = pop(p); ctx.translate(cx, 0); ctx.scale(Math.max(0.001, s), 1); ctx.translate(-cx, 0); return s > 0.01; }
// Where kit.drawText puts each word of a fitted text (the same arithmetic), and the runs of consecutive key words on one row: a key
// phrase of several words gets one sticker, not one per word.
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
// rows, and an invisible spacer word sits between the run and a neighbour on its row, so the run's sticker does not reach the neighbour.
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
