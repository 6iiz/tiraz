// Cell cinema motion: nothing moves the way a drawn thing moves. Things happen the way a sheet makes them happen: a formula is typed
// into the bar character by character, Enter drops the result into its cells at once, a cell whose rule fires flashes light for an
// instant and settles into its fill, and the selection hops from cell to cell. The only smooth motion is the camera (scroll and zoom).
// This file holds what every part shares: the palette, the grid (with right-to-left sheets mirrored: column A on the right), merged
// ranges, painted cells, the selection, the formula bar, and where the words of a fitted text sit.
import { clamp, mix, rgba, contrast } from '/engine/kit.js';

const lum = (h) => contrast(h, '#000000');
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = lum(bg) >= lum(text) ? bg : text, dark = light === bg ? text : bg;
  const on = (fill) => (contrast(fill, dark) >= contrast(fill, light) ? dark : light);
  const readable = (k) => { let c = mix(dark, light, k); while (k > 0 && contrast(c, light) < 4.8) { k -= 0.04; c = mix(dark, light, Math.max(0, k)); } return c; };
  const scale = [0.78, 0.58, 0.38, 0.18, 0].map((k) => mix(accent, light, k));     // a five-step colour scale, pale to full
  return {
    light, dark, accent, on, ink: dark, muted: readable(0.5), scale,
    grid: mix(light, dark, 0.12), paintLine: rgba(dark, 0.35),
    shell: mix(light, dark, 0.1), shell2: mix(light, dark, 0.05), shellLine: mix(light, dark, 0.22), shellText: readable(0.55),
    head: mix(light, dark, 0.07), headOn: mix(accent, light, 0.7), grey: mix(light, dark, 0.16),
  };
}

// The sheet's geometry at a zoom. Column c, row r (from 0) → screen rect. In a right-to-left sheet column A is on the right.
export function sheet(T, W, rtl, z = 1) {
  const g = T.grid, cw = g.cw * z, rh = g.rh * z;
  const left = rtl ? 0 : g.head, right = rtl ? W - g.head : W;
  const x = (c) => (rtl ? right - (c + 1) * cw : left + c * cw);
  const cols = Math.floor((right - left) / cw + 1e-6), rows = Math.ceil((g.bottom - g.top) / rh);
  return {
    cw, rh, left, right, top: g.top, bottom: g.bottom, cols, rows, rtl,
    rect(c0, r0, c1 = c0, r1 = r0) { const a = x(c0), b = x(c1); const x0 = Math.min(a, b), x1 = Math.max(a, b) + cw; return { x: x0, y: g.top + r0 * rh, w: x1 - x0, h: (r1 - r0 + 1) * rh }; },
    yOf: (r) => g.top + r * rh,
    rowAt: (y) => Math.floor((y - g.top) / rh),
    colAt: (px) => (rtl ? Math.floor((right - px) / cw) : Math.floor((px - left) / cw)),
  };
}
export const colName = (c) => String.fromCharCode(65 + c);
export const ref = (c, r) => colName(c) + (r + 1);

// A merged range: one cell over many, filled and bordered so the grid lines under it disappear.
export function merged(ctx, S, c0, r0, c1, r1, P, fill = P.light, border = P.grid) {
  const R = S.rect(c0, r0, c1, r1);
  ctx.fillStyle = fill; ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.strokeRect(R.x + 0.75, R.y + 0.75, R.w - 1.5, R.h - 1.5);
  return R;
}
// One cell whose rule fired at time `fired`: an instant of light, then its fill with thin dark lines (as if all borders were set).
export function paint(ctx, R, t, fired, fill, P, flash = 0.12) {
  if (t < fired) return false;
  ctx.fillStyle = t - fired < flash ? mix(P.light, fill, clamp((t - fired) / flash) * 0.35) : fill;
  ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = P.paintLine; ctx.lineWidth = 1; ctx.strokeRect(R.x + 0.5, R.y + 0.5, R.w - 1, R.h - 1);
  return true;
}
// The selection: a thick ink border, a fill handle on the far bottom corner, and a thin marching outline (alive while a line holds).
export function selection(ctx, R, P, t, rtl, ants = true) {
  ctx.save();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.strokeRect(R.x - 1, R.y - 1, R.w + 2, R.h + 2);
  const hx = rtl ? R.x - 5 : R.x + R.w - 5; ctx.fillStyle = P.ink; ctx.fillRect(hx, R.y + R.h - 5, 10, 10);
  ctx.fillStyle = P.light; ctx.fillRect(hx + (rtl ? 8 : -2), R.y + R.h - 7, 3, 3);
  if (ants) { ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 30; ctx.strokeStyle = P.accent; ctx.lineWidth = 2; ctx.strokeRect(R.x - 7, R.y - 7, R.w + 14, R.h + 14); }
  ctx.restore();
}
// A dashed reference box around a range named in the formula (its colour is the formula reference's colour).
export function refBox(ctx, R, P, t, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 24; ctx.strokeStyle = P.accent; ctx.lineWidth = 3;
  ctx.strokeRect(R.x - 2, R.y - 2, R.w + 4, R.h + 4); ctx.fillStyle = rgba(P.accent, 0.08); ctx.fillRect(R.x, R.y, R.w, R.h); ctx.restore();
}

// The name box and the formula bar of the shell: `cell` in the name box, `formula` typed in from t0 (one character per `char` s) with a
// caret. Latin only (cell references and function names): Arabic is never typed letter by letter. The bar's frame is the ground's.
export function formulaBar(ctx, T, P, mono, t, t0, cell, formula, W) {
  const F = T.shell, n = Math.max(0, Math.min(formula.length, Math.floor((t - t0) / T.dur.char)));
  ctx.save(); ctx.font = `600 ${F.fontSize}px "${mono}"`; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
  ctx.fillStyle = P.ink; ctx.fillText(cell, F.nameX + 14, F.barY + F.barH / 2);
  const tx = F.fxX + 70, s = formula.slice(0, t >= t0 ? n : 0);
  ctx.fillText(s, tx, F.barY + F.barH / 2);
  const typing = t >= t0 && n < formula.length, blink = Math.floor(t * 2.4) % 2 === 0;
  if (typing || blink) { const w = ctx.measureText(s).width; ctx.fillStyle = P.ink; ctx.fillRect(tx + w + 3, F.barY + 12, 2.5, F.barH - 24); }
  ctx.restore();
  return t0 + formula.length * T.dur.char;                        // the moment Enter is pressed
}

// Where each word of a fitted text sits when drawn with kit.drawText(…, { x0, x1, y, align }).
export function rowsOf(f, x0, x1, y, align, rtl) {
  return f.rows.map((row, r) => {
    const yy = y + r * f.lead;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : align === 'start' ? (rtl ? x1 - row.width : x0) : (rtl ? x0 : x1 - row.width);
    let cur = rtl ? left + row.width : left;
    const words = row.words.map((w) => { const wl = rtl ? cur - w.width : cur; cur = rtl ? wl - f.space : wl + w.width + f.space; return { ...w, x: wl }; });
    return { y: yy, left, width: row.width, words };
  });
}
// A key phrase (*several words*) is one span per row, not one per word.
export function keySpans(f, x0, x1, y, align, rtl) {
  const out = [];
  rowsOf(f, x0, x1, y, align, rtl).forEach((row, r) => {
    let cur = null;
    for (const w of row.words) {
      if (!w.key) { cur = null; continue; }
      if (cur) { cur.x0 = Math.min(cur.x0, w.x); cur.x1 = Math.max(cur.x1, w.x + w.width); } else { cur = { x0: w.x, x1: w.x + w.width, y: row.y, row: r }; out.push(cur); }
    }
  });
  return out;
}
// The cells under a key span: the rows are whole rows of the grid, and across the row the fill stops just past the phrase (cut at the
// grid's own column lines inside it), so the emphasis reads as fired cells without covering the next word.
export function cellsUnder(S, s, size) {
  const xa = Math.min(s.x0, s.x1) - 12, xb = Math.max(s.x0, s.x1) + 12;
  const r0 = S.rowAt(s.y - size * 0.55), r1 = S.rowAt(s.y + size * 0.55);
  const ca = Math.min(S.colAt(xa), S.colAt(xb)), cb = Math.max(S.colAt(xa), S.colAt(xb));
  const cs = [];
  for (let r = r0; r <= r1; r++) for (let c = ca; c <= cb; c++) {
    const R = S.rect(c, r), x0 = Math.max(R.x, xa), x1 = Math.min(R.x + R.w, xb);
    if (x1 - x0 > 2) cs.push({ x: x0, y: R.y, w: x1 - x0, h: R.h, c, r });
  }
  const order = S.rtl ? (q) => -q.x : (q) => q.x;
  cs.sort((p, q) => p.r - q.r || order(p) - order(q));
  return { cells: cs, rect: { x: xa, y: S.yOf(r0), w: xb - xa, h: (r1 - r0 + 1) * S.rh }, c0: S.colAt(S.rtl ? xb : xa), r0 };
}
// Wrapped text with even rows (same size, narrower box while the row count holds).
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 16; w > o.maxW * 0.45; w -= 16) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}
// Rows a fitted text needs in a merged range (with a little air).
export const rowsFor = (f, rh, air = 0.5) => Math.max(1, Math.ceil((f.height - f.lead + f.size * 1.35) / rh + air));
