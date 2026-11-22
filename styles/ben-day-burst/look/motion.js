// Ben-day-burst motion and materials: a screen-printed pop poster. Everything on screen is a print: flat opaque blocks of colour,
// one field of oversized round dots fixed to the page, a bold object (a bulb, a cup, a gem, a heart) filled flat and drawn with a
// heavy dark key line, printed a few pixels off its fill. Each print is pulled plate by plate with a squeegee from the reading side:
// background block, dots, fill, key line. Prints repeat side by side in different colourways, and on a slow count each print is
// pulled again in the next colourway. Type is printed the same way: the blade crosses the row and each word lands whole behind it.
import { clamp, mix, contrast, span, ease } from '/engine/kit.js';

const lum = (h) => { const n = parseInt(h.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const E = ease.outCubic;

export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, night = paper === text ? bg : text;
  const tint = mix(paper, accent, T.tone.tint), shade = mix(night, accent, T.tone.shade);
  const on = (fill) => (contrast(fill, night) >= contrast(fill, paper) ? night : paper);
  // colourways: [block, dots, object fill]
  // all light-to-middle blocks, so re-pulling a print in the next colourway never flashes a large dark area on and off
  const ways = [[accent, shade, paper], [paper, tint, accent], [tint, accent, paper], [accent, tint, shade]];
  return { paper, night, accent, tint, shade, on, onAccent: on(accent), ways, faded: [paper, tint, tint], key: night };
}

// The dot field: one page-sized sheet of oversized round dots in one colour, fixed to the page. The dots swell along a diagonal.
export function dotSheet(W, H, color, cell) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.fillStyle = color;
  const a = Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a), R = Math.hypot(W, H);
  for (let i = -R / cell; i < R / cell; i++) for (let j = -R / cell; j < R / cell; j++) {
    const u = i * cell, v = j * cell, x = W / 2 + u * ca - v * sa, y = H / 2 + u * sa + v * ca;
    if (x < -cell || x > W + cell || y < -cell || y > H + cell) continue;
    const f = clamp(0.5 + 0.5 * Math.sin((x * 0.6 + y) * 0.0022 + 0.6));
    g.beginPath(); g.arc(x, y, cell * (0.12 + 0.36 * f), 0, Math.PI * 2); g.fill();
  }
  return cv;
}

// ---- objects, drawn in a 200 x 200 box. fill: the flat body; key: the key lines drawn over it.
const P2 = (f) => { const p = new Path2D(); f(p); return p; };
export const OBJECTS = {
  bulb: {
    body: P2((p) => { p.moveTo(70, 134.3); p.arc(100, 80, 62, 2.075, 1.066); p.lineTo(130, 160); p.lineTo(70, 160); p.closePath(); }),
    lines: [P2((p) => { p.rect(72, 166, 56, 10); p.rect(76, 182, 48, 10); }), P2((p) => { p.moveTo(86, 160); p.lineTo(86, 112); p.lineTo(100, 98); p.lineTo(114, 112); p.lineTo(114, 160); })],
    shine: P2((p) => { p.arc(100, 80, 44, 3.5, 4.4); }),
  },
  cup: {
    body: P2((p) => { p.moveTo(36, 66); p.lineTo(150, 66); p.lineTo(140, 158); p.quadraticCurveTo(137, 178, 116, 178); p.lineTo(70, 178); p.quadraticCurveTo(49, 178, 46, 158); p.closePath(); }),
    lines: [P2((p) => { p.moveTo(148, 92); p.bezierCurveTo(184, 88, 184, 140, 142, 140); }), P2((p) => { p.moveTo(18, 188); p.lineTo(182, 188); }),
      P2((p) => { p.moveTo(76, 52); p.bezierCurveTo(64, 38, 90, 30, 78, 14); p.moveTo(108, 52); p.bezierCurveTo(96, 38, 122, 30, 110, 14); })],
    shine: P2((p) => { p.moveTo(62, 84); p.lineTo(66, 150); }),
  },
  gem: {
    body: P2((p) => { p.moveTo(30, 74); p.lineTo(66, 32); p.lineTo(134, 32); p.lineTo(170, 74); p.lineTo(100, 176); p.closePath(); }),
    lines: [P2((p) => { p.moveTo(30, 74); p.lineTo(170, 74); p.moveTo(66, 32); p.lineTo(82, 74); p.lineTo(100, 176); p.moveTo(134, 32); p.lineTo(118, 74); p.lineTo(100, 176); p.moveTo(82, 74); p.lineTo(100, 32); p.lineTo(118, 74); })],
    shine: P2((p) => { p.moveTo(52, 62); p.lineTo(66, 46); }),
  },
  heart: {
    body: P2((p) => { p.moveTo(100, 172); p.bezierCurveTo(14, 116, 18, 34, 70, 34); p.bezierCurveTo(88, 34, 100, 48, 100, 62); p.bezierCurveTo(100, 48, 112, 34, 130, 34); p.bezierCurveTo(182, 34, 186, 116, 100, 172); p.closePath(); }),
    lines: [],
    shine: P2((p) => { p.arc(70, 72, 22, 3.6, 4.6); }),
  },
};
export const KINDS = Object.keys(OBJECTS);

// The squeegee: how much of a plate pulled from the reading side is printed, as a clip on the rectangle.
function wipe(ctx, r, p, rtl) { const w = r.w * E(p); ctx.beginPath(); ctx.rect(rtl ? r.x + r.w - w : r.x, r.y, w, r.h); ctx.clip(); }

// One print: block, dots, object fill (off register), key line, pulled plate by plate from t0. way: a colourway. obj: an OBJECTS
// entry (or null), placed at scale s around (ox, oy); extra(ctx) draws on the finished print (a giant dot, a number).
export function printTile(ctx, r, way, o) {
  const { t, t0, rtl, dots, keyC, paperC } = o, step = o.step ?? 0.07, d = o.plate ?? 0.22;
  const plates = [
    () => { ctx.fillStyle = way[0]; ctx.fillRect(r.x, r.y, r.w, r.h); },
    () => { ctx.drawImage(dots[way[1]], r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h); },
    () => { if (!o.obj) return; ctx.translate(o.ox + 7, o.oy + 5); ctx.scale(o.s, o.s); ctx.translate(-100, -100); ctx.fillStyle = way[2]; ctx.fill(o.obj.body); },
    () => {
      if (o.obj) {
        ctx.translate(o.ox, o.oy); ctx.scale(o.s, o.s); ctx.translate(-100, -100);
        ctx.strokeStyle = keyC; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 8;
        ctx.stroke(o.obj.body); for (const l of o.obj.lines) ctx.stroke(l);
        ctx.fillStyle = keyC; for (const l of o.obj.lines) if (l === o.obj.lines[0] && o.obj === OBJECTS.bulb) ctx.fill(l);
        ctx.strokeStyle = paperC; ctx.lineWidth = 9; ctx.stroke(o.obj.shine);
      }
      if (!o.fixed) o.extra?.(ctx);
    },
  ];
  plates.forEach((draw, i) => {
    const p = span(t, t0 + i * step, t0 + i * step + d); if (p <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); if (p < 1) wipe(ctx, r, p, rtl); draw(); ctx.restore();
  });
  if (o.fixed && o.extra && t >= t0) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); o.extra(ctx); ctx.restore(); }   // stays put while re-pulled
  const pb = span(t, t0, t0 + 3 * step + d);                        // the blade, riding the last plate's edge
  if (pb > 0 && pb < 1) { const q = span(t, t0 + 3 * step, t0 + 3 * step + d), x = rtl ? r.x + r.w - r.w * E(q) : r.x + r.w * E(q); ctx.fillStyle = keyC; ctx.fillRect(x - 6, r.y - 8, 12, r.h + 16); }
}
// A print that is pulled again in the next colourway every `every` s (from `start`, offset by `lag`): the old print stays under
// the new one until the new one is done.
export function cycling(ctx, r, ways, k0, o) {
  const n = o.t < o.start + o.lag ? 0 : Math.floor((o.t - o.start - o.lag) / o.every) + 1;
  const tN = o.start + o.lag + (n - 1) * o.every;
  if (n > 0) printTile(ctx, r, ways[(k0 + n - 1) % ways.length], { ...o, t: 1e9, t0: 0, extra: null });
  printTile(ctx, r, ways[(k0 + n) % ways.length], { ...o, t0: n === 0 ? o.t0 : tN, fixed: n > 0 });
}

// Where drawText puts each word, and runs of neighbouring key words on one row.
export function layout(kit, f, x0, x1, y, align = 'start') {
  const rtl = kit.rtl, words = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) { const wl = rtl ? cur - w.width : cur; words.push({ key: w.key, x: wl, y: yy, width: w.width, row: r }); cur = rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return words;
}
export function runs(words) {
  const out = [];
  words.forEach((w, i) => {
    if (!w.key) return; const last = out.at(-1);
    if (last && last.end === i - 1 && last.row === w.row) { last.x0 = Math.min(last.x0, w.x); last.x1 = Math.max(last.x1, w.x + w.width); last.end = i; }
    else out.push({ x0: w.x, x1: w.x + w.width, y: w.y, row: w.row, start: i, end: i });
  });
  return out;
}
// Type pulled by the blade: across all rows at once, from the reading side, in `d` s from t0; each word lands whole once the blade
// has passed its middle. A key run is printed on one accent block with a heavy key border, its words in the accent's own text colour.
// o: { x0, x1, y, align, color, t, t0, d, P, slab? (a fill behind each row), slabText? }
export function pullText(ctx, kit, f, o) {
  const rtl = kit.rtl, P = o.P, words = layout(kit, f, o.x0, o.x1, o.y, o.align ?? 'start'), d = o.d ?? 0.34;
  const span0 = rtl ? o.x1 : o.x0, len = o.x1 - o.x0;
  const when = (x) => o.t0 + d * clamp((rtl ? span0 - x : x - span0) / len);
  const blade = span(o.t, o.t0, o.t0 + d), bx = rtl ? span0 - len * blade : span0 + len * blade;
  if (o.slab) f.rows.forEach((row, r) => {
    const ws = words.filter((w) => w.row === r), a = Math.min(...ws.map((w) => w.x)), b = Math.max(...ws.map((w) => w.x + w.width));
    const pad = f.size * 0.28, x0 = a - pad, x1 = b + pad, cut = rtl ? Math.max(x0, bx) : Math.min(x1, bx);
    if ((rtl ? x1 - cut : cut - x0) <= 0) return;
    ctx.fillStyle = o.slab; ctx.fillRect(rtl ? cut : x0, ws[0].y - f.lead * 0.42, rtl ? x1 - cut : cut - x0, f.lead * 0.84);
  });
  for (const run of runs(words)) {
    const tw = when(rtl ? run.x1 : run.x0); if (o.t < tw) continue;
    const lead = f.size * 0.26, tail = Math.min(f.size * 0.16, f.space * 0.45), x = run.x0 - (rtl ? tail : lead), w = run.x1 - run.x0 + lead + tail;
    const y = run.y - f.size * 0.64, h = f.size * 1.28, g = E(span(o.t, tw, tw + 0.14));
    ctx.fillStyle = P.night; ctx.fillRect(rtl ? x + w + 5 - (w + 10) * g : x - 5, y - 5, (w + 10) * g, h + 10);   // the key border
    ctx.fillStyle = P.accent; ctx.fillRect(rtl ? x + w - w * g : x, y, w * g, h);
  }
  kit.drawText(ctx, f, { x0: o.x0, x1: o.x1, y: o.y, align: o.align ?? 'start', color: o.color ?? P.night, key: P.onAccent,
    each: (w, i) => { if (o.t < when(words[i].x + words[i].width / 2)) return false; } });
  if (blade > 0 && blade < 1) { ctx.fillStyle = P.night; ctx.fillRect(bx - 6, o.y - f.lead * 0.55, 12, f.height + f.lead * 0.1); }
}
export function balanced(kit, text, o) {
  const f = kit.fit(text, o); if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 12; w > o.maxW * 0.4; w -= 12) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break; best = g;
  }
  return best;
}
