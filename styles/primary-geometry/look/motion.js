// Primary-geometry motion: a machine of flat shapes that turns in quarter steps. Every move is a snap: fast out of rest, a long soft
// stop, no overshoot, no fade. Rotations come in multiples of 90 or 45 degrees, counted on the beat. Text never flies: it is typed by a
// small square that rolls along the baseline, and each word appears whole the moment the square reaches it. Stages for text are built
// from two right triangles that turn into place and lock into one plate; they leave by sliding apart along their seam.
// This file also holds what every part shares: the palette, the stepped clock, the stage, the rolling-square typesetter.
import { clamp, mix, contrast, span } from '/engine/kit.js';

export const SNAP = (p) => 1 - (1 - clamp(p)) ** 5;           // a crisp lock
export const OUT = (p) => clamp(p) ** 2.6;                    // accelerate away
export const Q = Math.PI / 2;

const lum = (h) => { const n = parseInt(h.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const readable = (fg, k, against, min = 4.6) => { let c = mix(fg, against, k); while (k > 0 && contrast(c, against) < min) { k = Math.max(0, k - 0.04); c = mix(fg, against, k); } return c; };

// night: the brand's darker colour, always the ground. paper: its lighter colour, the plates text sits on. accent: the moving part.
export function palette(brand, T) {
  const { bg, text, accent } = brand.colors;
  const paper = lum(text) >= lum(bg) ? text : bg, night = paper === text ? bg : text;
  return {
    night, paper, accent,
    on: contrast(night, accent) >= contrast(paper, accent) ? night : paper,      // text on the accent
    ink: night,                                                                    // text on paper
    grey: readable(night, 1 - T.tone.grey, paper),                                 // quiet text on paper
    light: readable(paper, 1 - T.tone.dim, night),                                 // quiet text on the night ground
    line: mix(night, paper, T.tone.line),                                          // construction lines
    slate: mix(night, paper, T.tone.slate),
    onSlate: readable(paper, 0.22, mix(night, paper, T.tone.slate)),
    deep: mix(night, accent, T.tone.deep),
  };
}

// The machine's clock: how many steps a part has taken at `time` when it steps every `every` s, starting at `phase`, each step a
// snap of `dur` s. Continuous, so angles and positions never jump.
export function steps(time, every, phase = 0, dur = 0.22) {
  const u = (time - phase) / every, n = Math.floor(u);
  return n + SNAP(((u - n) * every) / dur);
}

// Where drawText puts each word: the same arithmetic, so emphasis blocks and the rolling square can be placed before the words.
export function layout(kit, f, x0, x1, y, align = 'start') {
  const rtl = kit.rtl, words = [], rows = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead;
    const atStart = rtl ? x1 - row.width : x0, atEnd = rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    rows.push({ left, width: row.width, y: yy });
    let cur = rtl ? left + row.width : left;
    for (const w of row.words) {
      const wl = rtl ? cur - w.width : cur;
      words.push({ key: w.key, x: wl, y: yy, width: w.width, row: r });
      cur = rtl ? wl - f.space : wl + w.width + f.space;
    }
  });
  return { words, rows };
}
// Neighbouring key words on one row make one run: a multi-word key phrase gets one block, not one per word.
export function runs(words) {
  const out = [];
  words.forEach((w, i) => {
    if (!w.key) return;
    const last = out.at(-1);
    if (last && last.end === i - 1 && last.row === w.row) { last.x0 = Math.min(last.x0, w.x); last.x1 = Math.max(last.x1, w.x + w.width); last.end = i; }
    else out.push({ x0: w.x, x1: w.x + w.width, y: w.y, row: w.row, start: i, end: i });
  });
  return out;
}

// The stage: a plate (x, y, w, h) built from two right triangles that turn a quarter and slide home on `pin`, and part along their
// seam on `pout`. content() is drawn only on the locked plate, clipped to each half while it leaves.
export function stage(ctx, r, pin, pout, fill, content, flip = false) {
  if (pin <= 0 || pout >= 1) return;
  const { x, y, w, h } = r, q = SNAP(pin), o = OUT(pout);
  const A = flip ? [[x, y], [x + w, y], [x, y + h]] : [[x, y], [x + w, y], [x + w, y + h]];
  const B = flip ? [[x + w, y], [x + w, y + h], [x, y + h]] : [[x, y], [x + w, y + h], [x, y + h]];
  if (q >= 1 && o <= 0) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); content?.(); return; }
  const half = (P, sx, sy, turn) => {
    const cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
    ctx.save();
    ctx.translate(cx + sx * ((1 - q) * w * 0.32 + o * w * 0.9), cy + sy * ((1 - q) * h * 0.9 + o * h * 1.6));
    ctx.rotate(turn * (1 - q)); ctx.translate(-cx, -cy);
    ctx.beginPath(); ctx.moveTo(...P[0]); ctx.lineTo(...P[1]); ctx.lineTo(...P[2]); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (q >= 1 && content) { ctx.clip(); content(); }
    ctx.restore();
  };
  half(A, flip ? -1 : 1, -1, -Q); half(B, flip ? 1 : -1, 1, Q);
}

// Typesetting by the rolling square. f: a fitted text. o: { x0, x1, y, align, t, t0, pal, T, color, square, decor }.
// Each row starts rowGap after the one before; along a row the square rolls from the reading side to the row's end in `row` s, and
// a word appears whole when the square reaches its first letter. Key runs get one accent block, laid as their first word appears.
export function typeset(ctx, kit, f, o) {
  const T = o.T, D = T.dur, pal = o.pal, rtl = kit.rtl, align = o.align ?? 'start';
  const L = layout(kit, f, o.x0, o.x1, o.y, align);
  const rowT = (r) => o.t0 + r * D.rowGap;
  const appear = (b) => {
    const R = L.rows[b.row], dist = rtl ? R.left + R.width - (b.x + b.width) : b.x - R.left;
    return rowT(b.row) + D.row * dist / Math.max(1, R.width);
  };
  for (const run of runs(L.words)) {
    const g = SNAP(span(o.t, appear(L.words[run.start]), appear(L.words[run.start]) + 0.16));
    if (g <= 0) continue;
    const px = f.size * 0.16, x0 = run.x0 - px, w = run.x1 - run.x0 + px * 2, gw = w * g;
    ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? x0 + w - gw : x0, run.y - f.size * 0.64, gw, f.size * 1.28);
  }
  kit.drawText(ctx, f, { x0: o.x0, x1: o.x1, y: o.y, align, color: o.color ?? pal.ink, key: pal.on, decor: o.decor,
    each: (w, i, box, c) => { const a = span(o.t, appear(L.words[i]), appear(L.words[i]) + 0.05); if (a <= 0) return false; if (a < 1) c.globalAlpha *= a; } });
  if (o.square === false) return;
  const s = Math.max(14, f.size * 0.2);
  L.rows.forEach((R, r) => {
    const t0 = rowT(r), p = span(o.t, t0, t0 + D.row), gone = span(o.t, t0 + D.row, t0 + D.row + 0.16);
    if (p <= 0 || gone >= 1) return;
    const dist = R.width * p, x = rtl ? R.left + R.width - dist : R.left + dist, k = s * (1 - SNAP(gone));
    ctx.save(); ctx.translate(x, R.y + f.size * 0.6 + s / 2 + 6); ctx.rotate((rtl ? -1 : 1) * (dist / s) * Q);
    ctx.fillStyle = pal.accent; ctx.fillRect(-k / 2, -k / 2, k, k); ctx.restore();
  });
}
// The moment the last word of a typeset text appears, for timing what follows.
export const typed = (f, T, t0) => t0 + (f.rows.length - 1) * T.dur.rowGap + T.dur.row;
// Wrapped text with even rows: once a text needs several rows, the box is narrowed (same size) while the row count holds, so a
// last row is never one orphaned word.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 12; w > o.maxW * 0.4; w -= 12) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}
