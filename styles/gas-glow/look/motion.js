// Gas-glow motion and drawing kit. Words are hand-bent glass tubes mounted on a clear panel in a shop window. They are always there
// as pale glass; they do not move, they are lit. A segment is switched on: its electrode sparks, the tube catches with a short stutter,
// and the gas column runs along the tube from the electrode at the reading side to the far end. Segments light one after another,
// each with its own switch. A dying tube stutters and leaves only the glass. Between words, black-painted double-backs carry the gas
// on to the next segment; little clear standoffs hold every word off the panel.
// The glow of every word is painted once (in create) into a small picture of its own; a frame only lays those pictures down, cropped
// to how far the gas has run and at the tube's brightness.
import { clamp, ease, mix, contrast, rgba, font, rng } from '/engine/kit.js';

export const E = ease.outCubic;
const lum = (c) => contrast(c, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const lift = (c) => { let k = 0; let o = c; while (contrast(o, dark) < 3.2 && k < 0.8) { k += 0.1; o = mix(c, light, k); } return o; };
  const gasKey = lift(accent), gasMain = mix(light, accent, 0.12);
  return {
    light, dark, accent, rgba,
    wall: dark, peg: mix(dark, light, 0.07), frame: mix(dark, light, 0.1), frameHi: mix(dark, light, 0.22), sill: mix(dark, light, 0.075),
    metal: mix(dark, light, 0.3), metalDark: mix(dark, light, 0.16), cable: mix(dark, light, 0.06), paint: mix(dark, light, 0.15),
    glass: mix(dark, light, 0.17), glassHi: mix(dark, light, 0.36),
    painted: mix(light, dark, 0.22),
    main: { core: mix(gasMain, light, 0.7), tube: gasMain, glow: mix(light, accent, 0.3) },
    key: { core: mix(gasKey, light, 0.45), tube: gasKey, glow: gasKey },
    onKey: contrast(accent, dark) >= contrast(accent, light) ? dark : light,
  };
}

// A tube catching: brightness over p (0..1) of its strike, with two short stutters (each tube its own), then steady.
export function strike(p, seed = 1) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const r = rng(seed * 4091 + 7), a = 0.12 + r() * 0.1, b = a + 0.1 + r() * 0.08;
  if (p < a) return 0.85;
  if (p < a + 0.07) return 0.18;
  if (p < b) return 1;
  if (p < b + 0.06) return 0.35;
  return 1;
}
// A tube failing: a stutter, then out (only the glass is left).
export function fail(p, seed = 3) {
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  const r = rng(seed * 733 + 1), a = 0.2 + r() * 0.15;
  if (p < a) return 0.4;
  if (p < a + 0.12) return 1;
  if (p < 0.75) return 0.25;
  return 0.12 * (1 - (p - 0.75) / 0.25);
}
// The hum: a steady tube breathes very slightly.
export const hum = (time, i = 0) => 0.95 + 0.05 * Math.sin(time * 2.1 + i * 1.7);

// Word boxes of a fitted text, set exactly as kit.drawText sets them.
export function layout(f, { x0, x1, y, align = 'center' }, rtl) {
  const words = []; let index = 0;
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      words.push({ ...w, x: wl, y: yy, width: w.width, row: r, index: index++, rowLeft: left, rowWidth: row.width });
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return words;
}

const paintWord = (c, w, f, x, y) => {
  c.font = font(f.weight, f.size, f.family); c.textBaseline = 'middle';
  c.direction = w.arabic ? 'rtl' : 'ltr'; c.textAlign = w.arabic ? 'right' : 'left';
  c.fillText(w.w, w.arabic ? x + w.width : x, y);
};

// A sign: a fitted text set as glass tubes at (x0..x1, y). o.tube: 'main' | 'key' | (word) => 'main' | 'key'. o.painted: true sets the
// text as painted letters on the panel instead (no tubes). Returns { words, draw(ctx, lit), rec(kit) }, where lit(i) gives the word's
// { run: 0..1 how far the gas has run, b: brightness }.
export function sign(f, box, pal, rtl, o = {}) {
  const words = layout(f, { align: 'start', ...box }, rtl), s = f.size;
  const pad = Math.round(s * 0.9);
  for (const w of words) {
    const kind = typeof o.tube === 'function' ? o.tube(w) : (w.key ? 'key' : (o.tube ?? 'main')), col = pal[kind];
    const cw = Math.ceil(w.width + pad * 2), ch = Math.ceil(s * 1.7 + pad * 2), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const c = cv.getContext('2d'), lx = pad, ly = ch / 2;
    c.filter = `blur(${Math.round(s * 0.34)}px)`; c.fillStyle = rgba(col.glow, 0.75); paintWord(c, w, f, lx, ly);
    c.filter = `blur(${Math.max(2, Math.round(s * 0.07))}px)`; c.fillStyle = col.tube; paintWord(c, w, f, lx, ly); paintWord(c, w, f, lx, ly);
    c.filter = 'none';                                           // the tube: its colour below, the bright core riding high in the bore
    const tc = document.createElement('canvas'); tc.width = cw; tc.height = ch; const t2 = tc.getContext('2d');
    t2.fillStyle = col.tube; paintWord(t2, w, f, lx, ly);
    t2.globalCompositeOperation = 'source-atop'; t2.fillStyle = col.core; paintWord(t2, w, f, lx, ly - s * 0.035);
    t2.fillStyle = rgba(col.core, 0.9); paintWord(t2, w, f, lx, ly - s * 0.06);
    c.drawImage(tc, 0, 0);
    w.lit = cv; w.ox = w.x - pad; w.oy = w.y - ch / 2; w.kind = kind;
  }
  // the unlit glass, the electrodes, the double-backs and the standoffs, all in one picture
  const minX = Math.min(...words.map((w) => w.x)) - s, maxX = Math.max(...words.map((w) => w.x + w.width)) + s;
  const minY = Math.min(...words.map((w) => w.y)) - s, maxY = Math.max(...words.map((w) => w.y)) + s;
  const gw = Math.ceil(maxX - minX), gh = Math.ceil(maxY - minY), glass = document.createElement('canvas'); glass.width = gw; glass.height = gh;
  const g = glass.getContext('2d'); g.translate(-minX, -minY);
  const tubeLine = (pts, wdt, col, hi) => { g.strokeStyle = col; g.lineWidth = wdt; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); if (hi) { g.strokeStyle = hi; g.lineWidth = Math.max(1.2, wdt * 0.25); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y - wdt * 0.2) : g.moveTo(x, y - wdt * 0.2))); g.stroke(); } };
  if (!o.painted) {
    const yb = (w) => w.y + s * 0.5;
    for (let i = 0; i + 1 < words.length; i++) {                 // black-painted double-backs from one segment to the next
      const a = words[i], b = words[i + 1], ax = rtl ? a.x : a.x + a.width, bx = rtl ? b.x + b.width : b.x;
      if (a.row === b.row) tubeLine([[ax, yb(a) - s * 0.12], [ax, yb(a)], [bx, yb(b)], [bx, yb(b) - s * 0.12]], s * 0.055, pal.paint, pal.metalDark);
      else { const ex = rtl ? a.rowLeft - s * 0.25 : a.rowLeft + a.rowWidth + s * 0.25; tubeLine([[ax, yb(a)], [ex, yb(a)], [ex, yb(b)], [bx, yb(b)]], s * 0.055, pal.paint, pal.metalDark); }
    }
    for (const w of words) {                                    // standoffs, then the electrode housings at both ends
      for (const k of [0.3, 0.7]) { const x = w.x + w.width * k; g.fillStyle = pal.metalDark; g.beginPath(); g.arc(x, yb(w) + 4, s * 0.06, 0, 7); g.fill(); g.fillStyle = pal.glassHi; g.beginPath(); g.arc(x - 1.5, yb(w) + 2.5, s * 0.022, 0, 7); g.fill(); }
      for (const x of [w.x - s * 0.06, w.x + w.width + s * 0.06]) { g.fillStyle = pal.paint; g.beginPath(); g.roundRect(x - s * 0.05, w.y - s * 0.05, s * 0.1, s * 0.3, s * 0.04); g.fill(); g.fillStyle = pal.metal; g.fillRect(x - s * 0.02, w.y + s * 0.22, s * 0.04, s * 0.06); }
    }
  }
  for (const w of words) {                                       // clear glass: a rim of light above, the tube's body below
    g.fillStyle = o.painted ? pal.painted : pal.glassHi; paintWord(g, w, f, w.x, w.y - (o.painted ? 0 : 1.5));
    if (!o.painted) { g.fillStyle = pal.glass; paintWord(g, w, f, w.x, w.y + 0.5); }
  }
  return {
    words,
    draw(ctx, lit) {
      ctx.drawImage(glass, minX, minY);
      if (o.painted) return;
      for (const w of words) {
        const L = lit(w.index, w); if (!L || L.run <= 0 || L.b <= 0) continue;
        const cw = w.lit.width, run = clamp(L.run), vis = (w.width + pad * 2) * (run >= 1 ? 1 : E(run)), sx = rtl ? cw - vis : 0;
        if (vis < 1) continue;
        ctx.save(); ctx.globalAlpha *= clamp(L.b);
        ctx.drawImage(w.lit, sx, 0, vis, w.lit.height, w.ox + sx, w.oy, vis, w.lit.height);
        if (run < 1) {                                         // the bright head of the gas column
          const hx = rtl ? w.ox + sx + pad * 0.6 : w.ox + vis - pad * 0.6, gr = ctx.createRadialGradient(hx, w.y, 0, hx, w.y, s * 0.6);
          gr.addColorStop(0, rgba(pal[w.kind].core, 0.55)); gr.addColorStop(1, rgba(pal[w.kind].glow, 0));
          ctx.fillStyle = gr; ctx.fillRect(hx - s * 0.6, w.y - s * 0.6, s * 1.2, s * 1.2);
        }
        ctx.restore();
      }
    },
    rec(kit) {
      const rows = {}; for (const w of words) (rows[w.row] ??= []).push(w);
      for (const r of Object.values(rows)) { const x0 = Math.min(...r.map((w) => w.x)), x1 = Math.max(...r.map((w) => w.x + w.width)); kit.rec(x0, x1, r[0].y - s * 0.7, r[0].y + s * 0.7, r.map((w) => w.w).join(' ')); }
    },
  };
}
// How far each word of a sign is lit at time t when the words are switched on one after another from t0, `step` apart.
export function sequence(t, t0, step, len, i, seed = 0) {
  const p = clamp((t - (t0 + i * step)) / len);
  return { run: p * 1.25, b: strike(p, i + 1 + seed) };
}
export const words = (f) => f.rows.reduce((s, r) => s + r.words.length, 0);
